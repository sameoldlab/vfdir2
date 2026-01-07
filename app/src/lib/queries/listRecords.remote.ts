import { type } from 'arktype'
import { is, type ActorIdentifier } from "@atcute/lexicons";
import { Client, simpleFetchHandler } from "@atcute/client";
import { NetworkCosmikCard, NetworkCosmikCollection, NetworkCosmikCollectionLink } from "$lib/services/atlex";
import { ComAtprotoRepoListRecords } from "@atcute/atproto";
import { ConvexHttpClient } from "convex/browser";
import { env } from "$env/dynamic/public";
import { api } from "$lib/convex/_generated/api";
import { command } from "$app/server";
import type { Id } from "$lib/convex/_generated/dataModel";
type RecordParams = { repo: ActorIdentifier, limit?: number, reverse?: boolean, cursor?: string }

async function listRecords(xrpc: Client, params: { repo: ActorIdentifier, collection: `${string}.${string}.${string}`, limit?: number, reverse?: boolean, cursor?: string }) {
  const records = await xrpc.call(ComAtprotoRepoListRecords, {
    params,
  })
  if (!records.ok) {
    return records.data
  }
  return records.data
}

async function* listCards(xrpc: Client, params: RecordParams) {
  let cursor: string | undefined
  do {
    const data = await listRecords(xrpc, {
      ...params,
      cursor,
      collection: 'network.cosmik.card',
    })

    if ('error' in data) {
      console.error(data.error, data.message)
      return
    }

    yield data.records?.map(c => {
      if (is(NetworkCosmikCard.mainSchema, c.value) && c.value.content.$type !== 'network.cosmik.card#noteContent') {
        return { ...c, value: c.value }
      }
    }).filter(e => e !== undefined)
    cursor = data.cursor
    console.log(data.cursor, cursor)
  } while (cursor)
}

async function* listConnections(xrpc: Client, params: RecordParams) {
  let cursor: string | undefined
  do {
    const data = await listRecords(xrpc, {
      ...params,
      cursor,
      collection: 'network.cosmik.collectionLink',
    })

    if ('error' in data) {
      console.error(data.error, data.message)
      return
    }

    yield data.records.map(c => {
      if (is(NetworkCosmikCollectionLink.mainSchema, c.value))
        return { ...c, value: c.value }
    }).filter(e => e !== undefined)
    cursor = data.cursor
  } while (cursor)
}

async function* listCollections(xrpc: Client, params: RecordParams) {
  let cursor: string | undefined
  do {
    const data = await listRecords(xrpc, {
      ...params,
      cursor,
      collection: 'network.cosmik.collection',
    })

    if ('error' in data) {
      console.error(data.error, data.message)
      return
    }

    yield data.records.map(c => {
      if (is(NetworkCosmikCollection.mainSchema, c.value))
        return { ...c, value: c.value }
    }).filter(e => e !== undefined)
    cursor = data.cursor
  } while (cursor)
}

const STATUS = Object.freeze({
  'CLOSED': 'closed',
  'OPEN': 'public'
})
const atpKey = (uri: string) => uri.split('/').at(-1)!


const crawlCosmic = async (xrpc: Client, params: RecordParams) => {
  const convex = new ConvexHttpClient(env.PUBLIC_CONVEX_URL)
  console.log('start crawl')

  const promises: Promise<({
    user: [string, Id<'users'>]
    entry: [string | number, Id<'entries'>]
  } | null)[]>[] = []

  for await (const batch of listCards(xrpc, params)) {
    const entries = batch.map(({ cid, uri, value: v }) => {
      const rest: {
        type: 'text' | 'media' | 'blob' | 'link' | 'channel'
      } & Record<string, any> = { type: 'link' }
      switch (v.type) {
        case 'URL':
          rest.type = 'link'
          rest.description = v.content.metadata?.description ?? ''
          rest.image = v.content.metadata?.imageUrl ?? ''
          rest.title = v.content.metadata?.title ?? ''
          rest.url = v.content.url
          rest.source = JSON.stringify(v.provenance)
          break
        case 'BLOB':
          rest.type = 'blob'
          rest.blob = v.content?.ref?.$link
          break
      }
      return {
        user: {
          displayName: params.repo,
          id: params.repo
        },
        title: '',
        description: '',
        ...rest,
        backing_service: 'cosmik',
        service_id: atpKey(uri),
        created_at: v.createdAt ? new Date(v.createdAt).valueOf() : Date.now(),
        updated_at: v.createdAt ? new Date(v.createdAt).valueOf() : Date.now(),
      }
    })
    console.log('ping')
    promises.push(convex.mutation(api.add.addEntries, { service: "atproto", entries }))
  }

  console.log('pulling collections')
  for await (const batch of listCollections(xrpc, params)) {
    const entries = batch.map(({ uri, value: v }) => ({
      user: {
        displayName: params.repo,
        id: params.repo
      },
      title: v.name ?? '',
      description: v.description ?? '',
      type: 'channel' as const,
      backing_service: 'cosmik',
      service_id: atpKey(uri),
      created_at: v.createdAt ? new Date(v.createdAt).valueOf() : Date.now(),
      updated_at: v.updatedAt ? new Date(v.updatedAt).valueOf() : Date.now(),
      status: STATUS[v.accessType] ?? 'closed',
    }))
    promises.push(convex.mutation(api.add.addEntries, { service: "atproto", entries }))
  }

  console.log('linking maps')
  const res = (await Promise.all(promises)).flat()
  const entries: Map<string, Id<'entries'>> = new Map()
  const users: Map<string | number, Id<'users'>> = new Map()
  res.filter(q => q !== null).forEach(({ entry: [ek, ev], user: [uk, uv] }) => {
    users.set(uk, uv)
    entries.set(ek as string, ev)
  })

  for await (const batch of listConnections(xrpc, params)) {
    console.log('connecting...')
    await Promise.all(batch.map(async ({ value: v }) => {
      const ckey = atpKey(v.card.uri)
      const pkey = atpKey(v.collection.uri)
      const cid = entries.get(ckey)
      const pid = entries.get(pkey)
      if (!cid) console.warn('missing id for', { cid, ckey })
      if (!pid) console.warn('missing id for', { pid, pkey })

      return await convex.mutation(api.add.connectEntry, {
        cid: cid ?? ckey,
        pid: pid ?? pkey,
        service: 'atproto',
        connected_at: new Date(v.addedAt).valueOf(),
        connected_by: users.get(params.repo) ?? { id: params.repo, displayName: params.repo },
      }).catch(console.error);
    }))
  }
  console.log('COMPLETE')
}

export const spiderUser = command(type({
  did: "string"
}), async ({ did }: { did: ActorIdentifier }) => {
  const xrpc = new Client({
    handler: simpleFetchHandler({ service: 'https://atp.same.supply' })
  })
  try {
    await crawlCosmic(xrpc, { repo: did, limit: 100, reverse: false })
  } catch (err) {
    console.error(err)
  }
})

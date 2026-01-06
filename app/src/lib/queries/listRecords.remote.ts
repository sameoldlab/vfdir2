import { type } from 'arktype'
import { is, type ActorIdentifier, type Did } from "@atcute/lexicons";
// import { NetworkCosmikCard } from '$lib/services/atlex/index'
import { Client, simpleFetchHandler } from "@atcute/client";
import { NetworkCosmikCard, NetworkCosmikCollection, NetworkCosmikCollectionLink } from "$lib/services/atlex";
import { ComAtprotoRepoListRecords } from "@atcute/atproto";
import { ConvexHttpClient } from "convex/browser";
import { env } from "$env/dynamic/public";
import { api } from "$lib/convex/_generated/api";
import { command } from "$app/server";
import type { Id } from "$lib/convex/_generated/dataModel";
type RecordParams = { repo: ActorIdentifier, limit?: number, reverse?: boolean, cursor?: string }

async function listRecords(params: { repo: ActorIdentifier, collection: `${string}.${string}.${string}`, limit?: number, reverse?: boolean, cursor?: string }) {
  const xrpc = new Client({
    handler: simpleFetchHandler({ service: 'https://atp.same.supply' })
  })
  const records = await xrpc.call(ComAtprotoRepoListRecords, {
    params,
  })
  if (!records.ok) {
    return records.data
  }
  if (records.data.cursor) {
    // there is more data
  }
  return records.data
}

async function listCards(params: { repo: ActorIdentifier, limit?: number, reverse?: boolean, cursor?: string }) {
  const data = await listRecords({
    ...params,
    collection: 'network.cosmik.card',
    reverse: params.reverse ?? false,
  })

  if ('error' in data) {
    console.error(data.error, data.message)
    return { cursor: undefined, records: [] }
  }

  return {
    ...data,
    records: data.records?.map(c => {
      if (is(NetworkCosmikCard.mainSchema, c.value) && c.value.content.$type !== 'network.cosmik.card#noteContent') {
        return { ...c, value: c.value }
      }
    }).filter(e => e !== undefined)
  }
}

async function listConnections(params: { repo: ActorIdentifier, limit?: number, reverse?: boolean, cursor?: string }) {
  const data = await listRecords({
    ...params,
    collection: 'network.cosmik.collectionLink',
    reverse: params.reverse ?? false,
  })

  if ('error' in data) {
    console.error(data.error, data.message)
    return { cursor: undefined, records: [] }
  }

  return {
    ...data,
    records: data.records.map(c => {
      if (is(NetworkCosmikCollectionLink.mainSchema, c.value))
        return { ...c, value: c.value }
    }).filter(e => e !== undefined)
  }
}

async function listCollections(params: { repo: ActorIdentifier, limit?: number, reverse?: boolean, cursor?: string }) {
  const data = await listRecords({
    ...params,
    collection: 'network.cosmik.collection',
  })

  if ('error' in data) {
    console.error(data.error, data.message)
    return { cursor: undefined, records: [] }
  }

  return {
    ...data,
    records: data.records.map(c => {
      if (is(NetworkCosmikCollection.mainSchema, c.value))
        return { ...c, value: c.value }
    }).filter(e => e !== undefined)
  }
}

const convex = new ConvexHttpClient(env.PUBLIC_CONVEX_URL)
const status = Object.freeze({
  'CLOSED': 'closed',
  'OPEN': 'public'
})
const crawlCosmic = async (params: RecordParams) => {
  console.log('start crawl')
  const [collections, cards, connections] = await Promise.all([listCollections(params), listCards(params), listConnections(params)])
  console.log(`found ${collections.records.length} collections, ${cards.records.length} cards, and ${connections.records.length} connections`)

  console.log('beggining addEntries')
  // combines cards and channels and pushes batches of up to 100
  const res = await convex.mutation(api.add.addEntries, {
    service: "atproto",
    entries: [
      ...collections?.records.map(({ cid, uri, value: v }) => ({
        user: {
          displayName: params.repo,
          id: params.repo
        },
        title: v.name ?? '',
        description: v.description ?? '',
        type: 'channel' as const,
        backing_service: 'cosmik',
        service_id: JSON.stringify({ cid, uri }),
        created_at: v.createdAt ? new Date(v.createdAt).valueOf() : Date.now(),
        updated_at: v.updatedAt ? new Date(v.updatedAt).valueOf() : Date.now(),
        status: status[v.accessType] ?? 'closed',
      })),
      ...cards?.records.map(({ cid, uri, value: v }) => {
        const rest: {
          type: 'text' | 'media' | 'blob' | 'link' | 'channel'
        } & Record<string, any> = { type: 'link' }
        switch (v.type) {
          case 'URL':
            rest.type = 'link'
            rest.description = v.content.metadata?.description ?? ''
            rest.image = v.content.metadata?.imageUrl ?? ''
            rest.title = v.content.url ?? ''
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
          service_id: JSON.stringify({ cid, uri }),
          created_at: v.createdAt ? new Date(v.createdAt).valueOf() : Date.now(),
          updated_at: v.createdAt ? new Date(v.createdAt).valueOf() : Date.now(),
        }
      })
    ]
  })
  // service_id is mapped to convex _id for faster lookups
  console.log('linking maps')
  const entries: Map<string, Id<'entries'>> = new Map()
  const users: Map<string, Id<'users'>> = new Map()
  res.filter(q => q !== null).forEach(({ entry: [ek, ev], user: [uk, uv] }) => {
    users.set(uk, uv)
    entries.set(ek as string, ev)
  })
  console.log('connecting...')

  // send entries individually
  await Promise.all(connections?.records.map(async ({ value: v }) => {
    const ckey = JSON.stringify({ cid: v.card.cid, uri: v.card.uri })
    const pkey = JSON.stringify({ cid: v.collection.cid, uri: v.collection.uri })
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
  console.log('COMPLETE')
}

export const spiderUser = command(type({
  did: "string"
}), async ({ did }: { did: ActorIdentifier }) => {
  try {
    await crawlCosmic({ repo: did, limit: 100, reverse: false })
  } catch (err) {
    console.error(err)
  }
})

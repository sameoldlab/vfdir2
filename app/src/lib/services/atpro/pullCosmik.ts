// SPDX-License-Identifier: MPL-2.0

import { is, type ActorIdentifier, type ResourceUri } from "@atcute/lexicons";
import { Client, simpleFetchHandler } from "@atcute/client";
import { NetworkCosmikCard, NetworkCosmikCollection, NetworkCosmikCollectionLink } from "$lib/services/atlex";
import { ComAtprotoRepoListRecords } from "@atcute/atproto";
import type { Id } from "$lib/convex/_generated/dataModel";
import type { ResolvedActor } from '@atcute/identity-resolver';
import { User } from '$lib/data/user.svelte'
import { Block } from '$lib/data/block.svelte'
import { Channel, Connection } from '$lib/data/channel.svelte';
import { channels } from '$lib/data/maps.svelte';

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
const CosmikTypes: Readonly<
  Record<'NOTE' | 'LINK' | 'BLOB', Block['type']>
> = Object.freeze({
  NOTE: 'text',
  BLOB: 'media',
  LINK: 'link',
})
const atpKey = (uri: ResourceUri) => {
  let [did, collection, hash] = uri.slice(5).split('/')
  if (!did || !collection || !hash) {
    throw new Error(`invalid resourceHash ${uri}`)
  }
  return `${did}/${collection}/${hash}`
}


const crawlCosmic = async (xrpc: Client, params: RecordParams) => {

  const promises: Promise<({
    user: [string, Id<'users'>]
    entry: [string | number, Id<'entries'>]
  } | null)[]>[] = []

  for await (const batch of listCards(xrpc, params)) {
    batch.map(({ cid, uri, value: v }) => {
      if (v.type == 'NOTE') return
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
          if (v.content.$type === 'network.cosmik.card#urlContent') {
            v.content.metadata?.type
          }
          break
        case 'BLOB':
          rest.type = 'blob'
          // rest.blob = v.content?.ref?.$link
          // TODO: resolve blob content.type to mime and split media (img, video, music, pdf ) from attachments
          break
      }

      new Block({
        id: atpKey(uri),
        author_slug: params.repo,
        title: '',
        description: '',
        ...rest,
        type: CosmikTypes[v.type],
        // attachment: v.type === 'BLOB' ? v.content.ref.$link : undefined,
        // backing_service: 'cosmik',
        created_at: v.createdAt ? new Date(v.createdAt).valueOf() : Date.now(),
        updated_at: v.createdAt ? new Date(v.createdAt).valueOf() : Date.now(),
      })
    })
  }

  console.log('pulling collections')
  for await (const batch of listCollections(xrpc, params)) {
    const entries = batch.map(({ uri, value: v }) => new Channel({
      id: atpKey(uri),
      slug: atpKey(uri),
      title: v.name ?? '',
      status: STATUS[v.accessType] ?? 'closed',
      description: v.description ?? '',
      // backing_service: 'cosmik',
      created_at: v.createdAt ? new Date(v.createdAt).valueOf() : Date.now(),
      updated_at: v.updatedAt ? new Date(v.updatedAt).valueOf() : Date.now(),
      author: params.repo,
    }))
  }

  console.log('linking maps')
  for await (const batch of listConnections(xrpc, params)) {
    console.log(`connecting batch ${promises.length}`)
    batch.forEach(({ value: v }) => {
      const parent_id = atpKey(v.collection.uri)
      channels.get(parent_id)?.addEntry(new Connection({
        parent_id,
        child_id: atpKey(v.card.uri),
        connected_at: new Date(v.addedAt).valueOf(),
        connected_by: v.addedBy,
        pinned: false,
        position: Infinity,
      }))
    })
  }

  console.log('COMPLETE')
}

export const pullCosmik = async ({ did, pds, handle }: ResolvedActor) => {
  const xrpc = new Client({
    handler: simpleFetchHandler({ service: pds })
  })
  User.upsert(did, handle, '')
  crawlCosmic(xrpc, { repo: did, limit: 100, reverse: false })
    .catch(console.error)
}

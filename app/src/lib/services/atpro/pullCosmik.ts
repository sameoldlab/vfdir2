// SPDX-License-Identifier: MPL-2.0

import { is, type ActorIdentifier, type ResourceUri } from "@atcute/lexicons";
import { Client, simpleFetchHandler } from "@atcute/client";
import { NetworkCosmikCard, NetworkCosmikCollection, NetworkCosmikCollectionLink } from "$lib/services/atlex";
import { ComAtprotoRepoListRecords } from "@atcute/atproto";
import type { Id } from "$lib/convex/_generated/dataModel";
import type { ResolvedActor } from '@atcute/identity-resolver';

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

const crawlCosmic = async (xrpc: Client, params: RecordParams) => {
  for await (const batch of listCards(xrpc, params)) {
  }

  console.log('pulling collections')
  for await (const batch of listCollections(xrpc, params)) {
  }


  console.log('COMPLETE')
}

export const pullCosmik = async ({ did, pds }: ResolvedActor) => {
  const xrpc = new Client({
    handler: simpleFetchHandler({ service: pds })
  })

  const cards: object[] = []
  const collections: object[] = []
  const connections: object[] = []

  for await (const batch of listCards(xrpc, { repo: did, limit: 100, reverse: false })) {
    cards.push(...batch)
  }

  for await (const batch of listCollections(xrpc, { repo: did, limit: 100, reverse: false })) {
    collections.push(...batch)
  }
  for await (const batch of listConnections(xrpc, { repo: did, limit: 100, reverse: false })) {
    connections.push(...batch)
  }

  console.log('COMPLETE')
  return { cards, collections, connections }
}

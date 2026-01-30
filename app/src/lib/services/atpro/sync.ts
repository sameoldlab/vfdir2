// SPDX-License-Identifier: MPL-2.0

import type { DB } from '@vlcn.io/crsqlite-wasm'
import { ev_stmt_close, record_connection, record_entry } from '$lib/database/events'
import type { TXAsync } from '@vlcn.io/xplat-api'
import {
  ComAtprotoRepoStrongRef,
  NetworkCosmikCard,
  NetworkCosmikCollection,
  NetworkCosmikCollectionLink
} from "$lib/services/atlex"
import { entries, channels } from '$lib/data/maps.svelte'
import type { Record } from '@atcute/atproto/types/repo/listRecords'
import { is, type ResourceUri } from '@atcute/lexicons'
import type { BlockI, ChannelI, ConnectionI } from '$lib/data/types'

const atpKey = (uri: ResourceUri) => {
  let [did, collection, hash] = uri.slice(5).split('/')
  if (!did || !collection || !hash) {
    throw new Error(`invalid resourceHash ${uri}`)
  }
  return `${did}/${collection}/${hash}`
}

const normalizeConnection = (rec: Record) => {
  if (is(NetworkCosmikCollectionLink.mainSchema, rec.value)) {
    const entry: ConnectionI = {
      key: '',
      parent_id: atpKey(rec.value.collection.uri),
      child_id: atpKey(rec.value.originalCard?.uri ?? rec.value.card.uri),
      position: 'position' in rec.value ? rec.value.position as number : Infinity,
      pinned: 'pinned' in rec.value ? rec.value.pinned as boolean : false,
      connected_at: new Date(rec.value.addedAt).valueOf(),
      connected_by: rec.value.addedBy,
    }
    return entry
  }
}

const normalizeEntry = (rec: Record) => {
  if (is(NetworkCosmikCollection.mainSchema, rec.value)) {
    const created_at = rec.value.createdAt ? new Date(rec.value.createdAt).valueOf() : Date.now()
    const updated_at = rec.value.updatedAt ? new Date(rec.value.updatedAt).valueOf() : created_at ?? Date.now()
    const entry: ChannelI = {
      uid: rec.cid,
      type: 'channel',
      key: atpKey(rec.uri),
      title: rec.value.name,
      description: rec.value.description ?? '',
      created_at,
      updated_at,
      status: rec.value.accessType === 'OPEN' ? 'public' : 'closed',
      author: rec.uri.split('/')[2]!,
    }
    return entry
  }

  if (!is(NetworkCosmikCard.mainSchema, rec.value)) return
  const created_at = rec.value.createdAt ? new Date(rec.value.createdAt).valueOf() : Date.now()
  const updated_at = 'updatedAt' in rec.value ? new Date((rec.value.updatedAt as string)).valueOf() : created_at ?? Date.now()
  const author_slug = 'provenance' in rec.value
    ? (rec.value.provenance as { via: ComAtprotoRepoStrongRef.Main }).via.uri.split('/')[2]!
    : rec.uri.split('/')[2]!

  const entry: BlockI = {
    uid: rec.cid,
    key: atpKey(rec.uri),
    author_slug,
    title: '',
    description: '',
    type: 'link',
    created_at,
    updated_at,
  }
  const { content } = rec.value
  if (is(NetworkCosmikCard.urlContentSchema, content)) {
    const url = new URL(content.url)
    entry.source = content.url
    entry.provider_url = url.host

    const { metadata } = content
    if (is(NetworkCosmikCard.urlMetadataSchema, metadata)) {
      if (metadata.imageUrl) entry.image = metadata.imageUrl
      entry.description = metadata.description ?? ''
      entry.title = metadata.title ?? content.url
    }
    return entry
  }
  if (is(NetworkCosmikCard.noteContentSchema, content)) {
    // cards should not have children.
    // uncomment processing for notes top-level blocks
    // base.type = 'text'
    // base.content = content.text
    return undefined
  }
  /*
  if (is(NetworkCosmikCard.imageContentSchema, content))
    media?: string,
    source?: string,
    attachment?: string,
  if (is(NetworkCosmikCard.attachmentContentSchema, content))
    media?: string,
    filename?: string,
    source?: string,
    attachment?: string,
  */
}

/** Save an array of atproto `network.cosmik.Card` or `network.cosmik.Collection` records */
export async function persistCosmikEntries(db: DB | TXAsync, newEntries: Record[]) {
  console.debug(`recording events with ${entries.size} entries materialized`)

  await Promise.all(newEntries.reduce((a: Promise<void | void[]>[], b) => {
    const e = normalizeEntry(b)
    if (e) a.push(record_entry(db, e, entries.get(e.key), {
      key: e.key,
      service: 'atproto',
      updated_at: e.updated_at,
      classType: e.type === 'channel' ? 'channel' : 'block',
    }))
    return a
  }, []))
    .then(() => ev_stmt_close(db))
}

/** Save an array of atproto `network.cosmik.CollectionLink` records */
export async function persistCosmikConnections(db: DB | TXAsync, connections: Record[]) {
  console.debug(`recording events with ${entries.size} entries materialized`)

  await Promise.all(connections.reduce((a: Promise<void | void[]>[], b) => {
    const e = normalizeConnection(b)
    if (e && !channels.get(e.parent_id)?.entries.find(e2 => e2.child_id === e.child_id)) {
      a.push(record_connection(db, e, 'atproto'))
    }
    return a
  }, []))
    .then(() => ev_stmt_close(db))
}


// SPDX-License-Identifier: MPL-2.0

import type { ULID } from "ulidx"
import type { DB } from "@vlcn.io/crsqlite-wasm"
import { Hlc, type HLC } from "./hlc"
import type { StmtAsync, TXAsync } from "@vlcn.io/xplat-api"
import { browser } from "$app/environment"
import type { BlockI, ChannelI, ConnectionI, Entry, EntryI, Service, User } from "$lib/data/types"

const VERSION = 1
let stmt: StmtAsync | null = null
let _hlc: Hlc | null = null
const hlc = () => {
  if (!browser) throw new Error('client side only script')
  if (_hlc) return _hlc
  _hlc = new Hlc(localStorage.getItem('deviceId')!)
  return _hlc
}
/** record to event log */
export const record = async <D extends object>(db: TXAsync | DB,
  { originId, data, objectId, type }:
    Pick<EventSchema<D>, 'objectId' | 'data' | 'type'> & { originId?: HLC }
) => {
  stmt = stmt === null ? await db.prepare(`
      insert into log (version, localId, originId, data, type, objectId) values(?,?,?,?,?,?)
    `) : stmt

  const localId = hlc().inc()
  originId = originId ?? localId
  // if (type === 'add:user')
  // console.log({ originId, type, objectId, data })
  try {
    return stmt.run(db, VERSION, localId, originId, JSON.stringify(data), type, objectId)
  } catch (err) {
    console.log(stmt)
    console.error(`Error recording log: ${err}`)
  }
}
export const ev_stmt_close = async (tx: TXAsync | null = null) => {
  stmt && await stmt.finalize(tx)
  stmt = null
  return
}

export type EventSchema<O extends object> = {
  version: number
  /** Unique id on event reception */
  localId: HLC
  /** Unique id from event source */
  originId: HLC
  data: O
  /**
   * add|mod|delete-column|row
   * @example add:block
   */
  type: 'mod' | 'connect' | 'save' | `${'add' | 'delete'}:${'user' | 'block' | 'channel'}` | `hash`
  /** 
   * field to which the event is related 
   * @example block:0L239vsDajfdse...
   */
  objectId: string
}

const diffEntry = (db: DB | TXAsync,
  { data, current, ...ids }:
    {
      data: EntryI,
      current: Entry,
      originId: HLC,
      objectId: HLC
    }
) => {
  const diffs: Record<string, any> = {}

  const sharedKeys: (keyof Entry)[] = ['title', 'description', 'updated_at', 'uid']
  const channelKeys: (keyof ChannelI)[] = ['status', 'image']
  const blockKeys: (keyof BlockI)[] = ['content']

  const keys = data.type === 'channel'
    ? (sharedKeys as string[]).concat(channelKeys)
    : (sharedKeys as string[]).concat(blockKeys)

  for (const key of keys) {
    if (current[key] !== data[key])
      diffs[key] = data[key]
  }

  if (Object.keys(diffs).length > 0) return record(db, { data: diffs, type: 'mod', ...ids })
}

/** @warning check if object has already been recorded to avoid bloating event log */
export const record_entry = async (
  db: DB | TXAsync,
  data: EntryI,
  current: Entry | undefined,
  { service, updated_at }: { service: Service, updated_at: number }
) => {
  const classType = data.type === 'channel' ? 'channel' : 'block'
  const objectId = `${classType}:${data.key}` as const
  const originId = hlc().receive(`${updated_at}:0:${service}`)

  if (!current) {
    return record(db, {
      objectId,
      type: `add:${classType}`,
      originId: originId,
      data
    })
  }

  if (current.uid === data.uid) return
  return diffEntry(db, { data, current, objectId, originId })
}

/** @warning check if object has already been recorded to avoid bloating event log */
export const record_user = async (db: DB | TXAsync, user: Partial<User>) => {
  const objectId = `user:${user.key}`
  const originId: HLC = hlc().receive(`${Date.now()}:0:arena`)
  return record(db, { objectId, type: `add:user`, originId, data: user })
}

/** @warning check if object has already been recorded to avoid bloating event log */
export const record_connection = (
  db: DB | TXAsync,
  data: ConnectionI,
  service: Service
) => {
  // TODO: diff connections for changes to position
  return record(db, {
    objectId: `connection:${JSON.stringify([data.parent_id, data.child_id])}`,
    type: `connect`,
    originId: hlc().receive(`${data.connected_at}:0:${service}`),
    data
  })
}

export const record_hash = (
  db: DB | TXAsync,
  key: string,
  hash: string,
) => {
  return record(db, {
    objectId: `hash:${key}`,
    type: `hash`,
    originId: hlc().receive(`${Date.now()}:0:local`),
    data: { key, hash }
  })
}

/* 
  Need a different way to track the order of changes as the data from the api does not record updates
  to the connection data (selected, position).
  I think hybrid logical clocks or lambert clocks could work? 
  Similar to the local-first event sourcing article.
  But I'm not sure how to implement this in my current system
*/

/* 
Arena's api also has an option to `GET /v2/channels/:id/contents`. 
So I could ignore this pain and use `GET /v2/channels/:id/contents` to read position
 and `PUT /v2/channels/:slug/sort` to update it 
PUT /v2/channels/:slug/sort
Resource URL:
http://api.are.na/v2/channels/:slug/sort
Parameters:
:ids (required)
Serialized array of IDs
 
Accepts a serialized array of IDs. Updates the order of the channel to the order of the IDs.
*/

export const block_del = (data) => {
  const objectId = `block:${data.slug}`
  const type = `del:${data.slug}`

  // record({ objectId, type, originId, data })
}

export const channel_add = (data) => {
  const objectId = `channel:${data.slug}`

  const type = `add:block`
}

export const channel_del = (data) => {
  const objectId = `channel:${data.slug}`

  const type = `del:${data.slug}`
}

// order of blocks, add block, block's selected status
export const connection_add = (data) => {
  const objectId = `connection:${data.slug}`

  const type = `add:connection`
}

export const connection_del = (data) => {
  const objectId = `connection:${data.slug} `

  const type = `del:${data.slug} `
}

export const extern_user_sync = (data, userId: ULID | undefined = undefined) => {
  if (!userId) {
    let ndata = {
      id: data.id,
      slug: data.slug,
      firstname: data.first_name,
      lastname: data.last_name,
      avatar: data.avatar,
      external_ref: `arena:${data.class === 'Channel'
        ? data.owner_id
        : data.user.id
        } `
    }
    return
  }
}

export const lcl_user_mod = (data) => { }

/* 
# Function
- pull from are.na
-
# Event
- add channel, block
- create connection
-
# Transaction
- send request to service
- 


- i think uhat might be it?

open vfdir
  create instance uuid (distinct between devices and browsers)
connect to external account
  import data from source
add new block to channel
  add local image reference  
move block to new position
  set position for block-channel (TODO: need to think about this more) 
publish channel
  set channel visibility public
create collaborative channel
*/

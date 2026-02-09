// SPDX-License-Identifier: MPL-2.0

import { EventSchemaR } from "./schema"
import { create } from "superstruct"
import type { DB, TXAsync } from "@vlcn.io/xplat-api"
import { Block } from '$lib/data/block.svelte'
import { Channel } from '$lib/data/channel.svelte'
import type { ConnectionI, EntryI } from "$lib/data/types"
import { User } from '$lib/data/user.svelte'
import { channels, entries, media, pageSync, persistData } from "$lib/data/maps.svelte"
import { PersistedState } from 'runed'
import { browser } from "$app/environment"

let lastRow = new PersistedState('lastRow', 0n, {
  serializer: {
    deserialize: (val) => BigInt(val),
    serialize: (val) => val.toString(),
  }
})


/** Load past events into data maps */
export async function bootstrap(db: TXAsync | DB) {
  if (!browser) return
  const events = await db.execO('select rowid,* from log')
  console.debug(`loading ${events.length} events into memory`)
  parseEvent(events)
  // catch (err) { console.error(err) }
  return
}

export function parseEvent(events: object[]) {
  const eventsParsed: string[] = []
  for (const e of events) {
    let {
      type,
      originId: [_ts, _c, device],
      data,
    } = create(e, EventSchemaR)
    let [action, field] = typeof type === 'string' ? [type, undefined] : type

    eventsParsed.push(`type: ${type}, ${device},\ndata: ${JSON.stringify(data)} `)

    // TODO: runtime data validation
    if (action === 'add' && field === 'user') {
      const user = data as unknown as User
      User.upsert(user.key, user.name, user.avatar)
    } else if (action === 'add') {
      const obj = data as unknown as EntryI
      if (entries.get(obj.key)) {
        console.error(`duplicate block event found at ${e.rowid} on ${obj.key}`)
        throw new Error(`duplicate channel event found: ${obj.key}`)
        break
      }
      if (obj.type === 'channel') new Channel(obj)
      else new Block(obj)
    } else if (action === 'hash') {
      const { key, hash } = data as {
        key: string,
        hash: string
      }
      pageSync.set(key, hash)
    } else if (action === 'save') {
      media.set(data.original as string, data.url)
    }
  }
  // second pass to process connections after entries
  for (const e of events) {
    let {
      type: action,
      originId: [_ts, _c, _device],
      data,
    } = create(e, EventSchemaR)

    if (action === 'connect') {
      const conn = data as unknown as ConnectionI

      const child = entries.get(conn.child_id)
      let parent = channels.get(conn.parent_id)
      if (!parent) console.error(`connection recorded before parent: ${conn.parent_id}`)
      if (!child) console.error(`connection recorded before child: ${conn.child_id}`)
      child?.addConnection(conn.parent_id)
      parent?.addEntry(conn)
    }
  }
  console.debug(eventsParsed)
}

/*
async function insertO<O extends object>(tx: TXAsync, row: O, table: string, stmts: Map<string, StmtAsync>): Promise<[string, StmtAsync]> {
  const keys = Object.keys(row)
  const sql = `INSERT INTO ${table}(${keys.join(',')}) VALUES (${Array(keys.length).fill('?').join(',')});`

  try {
    const stmt = stmts.get(sql) ?? await tx.prepare(sql)
    await stmt.run(tx, ...Object.values(row))
    return [sql, stmt]
  } catch (error) {
    console.error({ error, sql, row })
  }
}
*/

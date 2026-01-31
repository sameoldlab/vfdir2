// SPDX-License-Identifier: MPL-2.0

import { EventSchemaR } from "./schema"
import { create } from "superstruct"
import type { DB, TXAsync } from "@vlcn.io/xplat-api"
import { Block } from '$lib/data/block.svelte'
import { Channel } from '$lib/data/channel.svelte'
import type { ConnectionI, EntryI } from "$lib/data/types"
import { User } from '$lib/data/user.svelte'
import { channels, entries, media, persistData } from "$lib/data/maps.svelte"
import { pool } from "./connectionPool.svelte"
import { PersistedState } from 'runed'
import { browser } from "$app/environment"

let lastRow = new PersistedState('lastRow', 0n, {
  serializer: {
    deserialize: (val) => BigInt(val),
    serialize: (val) => val.toString(),
  }
})

let channel: BroadcastChannel | null
const getChannel = () => {
  if (channel) return channel
  channel = new BroadcastChannel('updates')
  return channel
}

/** Load past events into data maps */
export async function bootstrap(db: TXAsync | DB) {
  if (!browser) return
  const events = await db.execO('select rowid,* from log')
  console.debug(`loading ${events.length} events into memory`)
  parseEvent(events)
  // catch (err) { console.error(err) }
  return
}

/** initialize broadcast channel watcher. auto-pulls new events into maps */
export const watchEvents = () => {
  console.debug('The Watcher stands prepared')
  getChannel().addEventListener('message', ev => {
    if (ev.data) {
      const ub: bigint[] = [...ev.data.values()]
      pool.exec(async (tx, db) => {
        await db.execO('select *,rowid from log where rowid between ? and ?', [ub[0]!, ub.at(-1)!])
          .then((events) => {
            console.debug(`reading ${events.length} events live`)
            parseEvent(events)
            console.error('FINISH THE PERSIST FUNCTION!!')
            // persistData().then(() => lastRow.current = ub.at(-1)!)
          })
        // .catch((err) => { console.error(err) })
      })
    }
  })
}

function parseEvent(events: object[]) {
  for (const e of events) {
    let {
      type: [action, field],
      originId: [_ts, _c, device],
      data,
    } = create(e, EventSchemaR)

    console.debug({
      type: [action, field],
      originId: [_ts, _c, device],
      data,
    })

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
      if (obj.type === 'channel') Channel.upsert(obj)
      else new Block(obj)
    } else if (action === 'connect') {
      const conn = data as unknown as ConnectionI

      const child = entries.get(conn.child_id)
      let parent = channels.get(conn.parent_id)
      if (!parent) throw new Error(`connection recorded before parent: ${conn.parent_id}`)
      if (!child) throw new Error(`connection recorded before child: ${conn.child_id}`)

      child.addConnection(conn.parent_id)
      parent.addEntry(data as unknown as ConnectionI)
    } else if (action === 'save') {
      media.set(data.original as string, data.url)
    }
  }
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

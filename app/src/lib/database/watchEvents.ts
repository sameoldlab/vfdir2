// SPDX-License-Identifier: MPL-2.0

import { EventSchemaR } from "./schema"
import { create } from "superstruct"
import type { DB, StmtAsync, TXAsync } from "@vlcn.io/xplat-api"
import { Block } from '$lib/data/block.svelte'
import { Channel, Connection } from '$lib/data/channel.svelte'
import { User } from '$lib/data/user.svelte'
import type { ArenaBlock, ArenaChannel, ArenaChannelContents } from "arena-ts"
import { channels, entries, media, persistData } from "$lib/data/maps.svelte"
import { pool } from "./connectionPool.svelte"

class LastRow {
  #val: bigint
  constructor() {
    this.#val = BigInt(localStorage.getItem('lastRow')) ?? 0n
    localStorage.setItem('lastRow', lastRow.toString())
  }
  get() {
    return this.#val
  }
  set(val: bigint) {
    localStorage.setItem('lastRow', val.toString())
    this.#val = BigInt(localStorage.getItem('lastRow')) ?? 0n
  }
}
let lastRow = new LastRow()

export async function bootstrap(db: TXAsync | DB) {
  const events = await db.execO('select rowid,* from log')
  console.debug(`loading ${events.length} events into memory`)
  parseEvent(events)
  // catch (err) { console.error(err) }
  return
}

const channel = new BroadcastChannel('updates')
export const watchEvents = () => channel.addEventListener('message', ev => {
  if (ev.data) {
    const ub: bigint[] = [...ev.data.values()]
    pool.exec(async (tx, db) => {
      await db.execO('select *,rowid from log where rowid between ? and ?', [ub[0], ub.at(-1)])
        .then((events) => {
          parseEvent(events)
          persistData().then(() => lastRow.set(ub.at(-1)))
        })
      // .catch((err) => { console.error(err) })
    })
  }
})

const pullUsers = (data: ArenaChannel | ArenaChannelContents) => {
  if ('user' in data) {
    User.create(
      data.user.slug,
      data.user.first_name + ' ' + data.user.last_name,
      data.user.avatar_image.display,
    )
  }
  if ('connected_by_username' in data) {
    User.create(
      data.connected_by_user_slug,
      data.connected_by_username,
    )
  }
}
function parseEvent(events: object[]) {
  for (const e of events) {
    let {
      type: [action, field],
      originId: [_ts, _c, device],
      data,
    } = create(e, EventSchemaR)

    const from_arena = device === 'arena'
    // add external users to object graph
    if (from_arena) {
      pullUsers(data)
    }

    if (action === 'add') {
      switch (field) {
        case 'block': {
          const obj = from_arena ? Block.fromArena(data as ArenaBlock) : data
          if (entries.get(obj.id.toString())) {
            console.error(`duplicate block event found at ${e.rowid} on ${obj.id}`)
            // throw new Error(`duplicate block event found: ${obj.id}`)
            break
          }
          new Block(obj)
          break;
        }
        case 'channel': {
          const obj = from_arena ? Channel.fromArena(data as ArenaChannel) : data
          if (entries.get(obj.slug)) {
            console.error(`duplicate block event found at ${e.rowid} on ${obj.slug}`)
            // throw new Error(`duplicate channel event found: ${obj.slug}`)
            break
          }
          new Channel(obj)
          break
        }
      }
    }
    if (action === 'connect') {
      const key = data.is_channel ? data.child.slug : data.child.id.toString();
      (entries.get(key) ?? (data.is_channel
        ? new Channel(Channel.fromArena(data.child as ArenaChannel))
        : new Block(Block.fromArena(data.child as ArenaBlock)))
      ).addConnection(data.parent.slug)

      let parent = channels.get(data.parent.slug)
      if (!parent) {
        const chan = from_arena ? Channel.fromArena(data.parent as ArenaChannel) : data.parent;
        new Channel(chan)
      }
      parent.addEntry(Connection.fromArena(data))
    }
    if (action === 'save') media.set(data.original, data.url)
  }
}

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

// SPDX-License-Identifier: MPL-2.0

import { SvelteMap } from "svelte/reactivity"
import type { Channel, User, Entry, Media, ConnectionI, BlockI, ChannelI } from './types'
import { openDB, type DBSchema } from 'idb'

export const entries = $state(new SvelteMap<string, Entry>())
export const channels = $state(new SvelteMap<string, Channel>())
export const users = $state(new SvelteMap<string, User>())
export const media = $state(new SvelteMap<Media['key'], Media['value']>())
export const pageSync = new Map<string, string>()

export interface Store extends DBSchema {
  entries: {
    key: string,
    value: (ChannelI & { entries: ConnectionI[] } | BlockI) & { connections: Channel['key'][] }
  }
  users: {
    key: string,
    value: { key: string, name: string, avatar: string } & { entries: string[], channels: string[] }
  }
  media: { key: string, value: string }
  pageSync: { key: string, value: string },
}

export const persistData = async () => {
  const all = { entries, users, media, pageSync } as const
  const stores = Object.keys(all) as (keyof typeof all)[]

  const db = await openDB<Store>('objectStore', undefined, {
    upgrade(db) {
      for (const store of stores) {
        db.createObjectStore(store)
      }
    }
  })

  for (const store of stores) {
    const tx = db.transaction(store, 'readwrite')
    const obj = tx.objectStore(store)

    const writes: Promise<IDBValidKey | void>[] = []
    all[store].forEach(async (value: any, key: string) => {
      // try {
      let data = (store === 'media' || store === 'pageSync') ? value : value.write()
      writes.push(obj.put(data, key))
      // await obj.put(data, key)
      // } catch (e) {
      //   console.error(e)
      //   console.error(value.write())
      // }
    })

    writes.push(tx.done)
    // await tx.done
    await Promise.all(writes).catch((e) => console.trace(e, store))
  }

  db.close()
}

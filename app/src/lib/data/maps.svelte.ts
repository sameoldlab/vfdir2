// SPDX-License-Identifier: MPL-2.0

import { SvelteMap } from "svelte/reactivity"
import type { Channel, User, Entry, Media, ChannelI, BlockI } from './types'
import { openDB, type DBSchema } from 'idb'

export const entries = $state(new SvelteMap<string, Entry>())
export const channels = $state(new SvelteMap<string, Channel>())
export const users = $state(new SvelteMap<string, User>())
export const media = $state(new SvelteMap<Media['key'], Media['value']>())
export const pageSync = new Map<string, string>()

interface Store extends DBSchema {

  entries: { key: string, value: BlockI }
  channels: { key: string, value: ChannelI }
  users: { key: string, value: { key: string, name: string, avatar: string } }
  media: { key: string, value: string }
  pageSync: { key: string, value: string },
}
export const persistData = async () => {
  const all = { entries, channels, users, media, pageSync } as const
  const stores = Object.keys(all) as (keyof typeof all)[]

  const db = await openDB<Store>('objectStore', undefined, {
    upgrade(db, oldV, newV, transaction, event) {
      for (const store of stores) {
        if (db.objectStoreNames.contains(store)) continue
        db.createObjectStore(store)
      }
    }
  })

  for (const store of stores) {
    const tx = db.transaction(store, 'readwrite')
    const obj = tx.objectStore(store)

    const writes: Promise<IDBValidKey | void>[] = []
    all[store].forEach((value: any, key: string) => {
      if (store === 'media' || store === 'pageSync') writes.push(obj.add(value, key))
      else writes.push(obj.add(value.write(), key))
    })

    writes.push(tx.done)
    await Promise.all(writes).catch((e) => console.trace(e, store))
  }

  db.close()
}

// SPDX-License-Identifier: MPL-2.0

import { SvelteMap } from "svelte/reactivity"
import type { Channel, User, Entry, Media, Base } from './types'
import { openDB } from 'idb'

export const entries = $state(new SvelteMap<string, Entry>())
export const channels = $state(new SvelteMap<string, Channel>())
export const users = $state(new SvelteMap<string, User>())
export const media = $state(new SvelteMap<string, Media>())

export const persistData = async () => {
  const all = { entries, channels, users, media }
  const db = await openDB('objectStore', undefined, {
    upgrade(db, oldV, newV, transaction, event) {
      for (const store of ['blocks', 'channels', 'media', 'users']) {
        if (db.objectStoreNames.contains(store)) continue
        db.createObjectStore(store, { keyPath: 'key' })
      }
    }
  })

  const writeMap = async (value: Base, key: Base['key'], store: string) => {
    const data = store !== 'media' ? value.write() : value
    await db.add(store, data)
  }
  for (const store of ['blocks', 'channels', 'media', 'users']) {
    const tx = db.transaction(store, 'readwrite')
    await Promise.all([
      all[store].forEach((v, k) => writeMap(v, k, 'entries')),
      tx.done
    ])
  }

}

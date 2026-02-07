// SPDX-License-Identifier: MPL-2.0

import { entries, channels, users } from "./maps.svelte"
import type { Collectable, Entry, Collection, User } from "./types"

export type ConnectionI = ConstructorParameters<typeof Connection>[0]
export class Connection {
  key: string
  parent_id: string
  child_id: string
  position: number
  pinned: boolean
  connected_at: number
  _connected_by: User['key']

  constructor(obj: {
    key: string,
    parent_id: Channel['key'],
    child_id: Entry['key'],
    position: number,
    pinned: boolean,
    connected_at: number,
    connected_by: User['key'],
  }) {
    Object.assign(this, {
      ...obj,
      _connected_by: obj.connected_by
    })
  }

  get connnected_by() {
    return users.get(this._connected_by)
  }
  get() {
    const child = entries.get(this.child_id)
    if (!child) {
      console.error(`Child not found for ${this.key} `);
      return
    }
    return Object.assign(child, {
      position: this.position,
      pinned: this.pinned,
      connected_at: this.connected_at,
      connected_by: this.connected_by,
    }) as Entry & Partial<Connection>
  }
}
export type ChannelI = ConstructorParameters<typeof Channel>[0]
export class Channel implements Collection, Collectable {
  key: string
  title: string
  uid: string
  type: 'channel' = 'channel'
  description: string
  created_at: number
  updated_at: number
  status: 'private' | 'public' | 'closed'
  image: string
  _author: string

  _entries: Connection[] = $state([])
  #keys = new Set<string>()
  _connections = new Set<string>()

  constructor(obj: {
    key: string,
    uid: string,
    title: string,
    type: 'channel',
    description: string,
    created_at: number,
    updated_at: number,
    status: 'private' | 'public' | 'closed',
    image?: string | undefined,
    author_slug: string,
  }) {
    Object.assign(this, {
      ...obj,
      _author: obj.author_slug,
      image: obj.image ?? '',
    })

    channels.set(this.key, this)
    entries.set(this.key, this)
    console.log(`adding entry ${this.key}`)
    users.get(this._author)?.addEntry(this.key, 'channels')
  }

  get author() {
    const a = users.get(this._author)
    if (!a) throw Error(`${this._author} not found on ${this}`)
    return a
  }
  get entries() {
    return this._entries.map(conn => conn.get()).filter(e => e !== undefined)
  }
  get connections() {
    return [...this._connections.values()].map(slug => channels.get(slug)).filter(e => e !== undefined)
  }
  addConnection(key: Collection["key"]) {
    this._connections.add(key)
  }
  rmConnection(key: Collection["key"]) {
    return false
  }
  removeEntry(key: Collectable["key"]) {
    return false
  }
  addEntry(conn: ConnectionI) {
    if (this.#keys.has(conn.child_id)) return
    this.#keys.add(conn.child_id)
    this._entries.push(new Connection(conn))
    this._entries.sort((a, b) => a.position - b.position)
  }
  get length() {
    return this._entries.length
  }
  static upsert(obj: ChannelI) {
    const existing = channels.get(obj.key)
    if (existing) return existing
    return new Channel(obj)
  }
}


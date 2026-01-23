// SPDX-License-Identifier: MPL-2.0

import type { ArenaChannel, ArenaConnection, ArenaEntry } from "$lib/services/arena/types"
import { entries, channels, users, populateUser } from "./maps.svelte"
import type { Collectable, Entry, Collection, User } from "./types"

type ConnectionI = {
  key: string
  parent_id: string
  child_id: string
  position: number
  pinned: boolean
  connected_at: number
  connected_by: string
}

export class Connection {
  key: string
  parent_id: string
  child_id: string
  position: number
  pinned: boolean
  connected_at: number
  #connected_by: User['key']

  constructor(obj: ConnectionI) {
    this.parent_id = `${obj.parent_id}`
    this.child_id = `${obj.child_id}`
    this.key = this.child_id
    this.position = obj.position
    this.pinned = obj.pinned
    this.connected_at = obj.connected_at
    this.#connected_by = obj.connected_by
  }
  get connnected_by() {
    return users.get(this.#connected_by)
  }
  get() {
    const child = entries.get(this.child_id)
    if (!child) {
      console.error(`Child not found for ${this.key} `);
      return
    }
    return Object.assign(child, this) as Entry & Connection
  }
  static fromArena(conn: ArenaConnection, child: ArenaEntry): ConnectionI {
    return {
      key: `${conn.id}:${child.id}`,
      parent_id: conn.id.toString(),
      child_id: child.type === 'Channel' ? child.slug : child.id.toString(),
      position: conn.position,
      pinned: conn.pinned ? true : false,
      connected_at: new Date(conn.connected_at).valueOf(),
      connected_by: conn.connected_by?.slug ?? ''
    }
  }
}
type ChannelI = {
  slug: string,
  id: string,
  title: string,
  description: string,
  created_at: number,
  updated_at: number,
  status: string,
  image?: string,
  author: string,
}
export class Channel implements Collection, Collectable {
  key: string
  slug: string
  id: string
  title: string
  type: 'channel' = 'channel'
  description: string
  created_at: number
  updated_at: number
  status: 'private' | 'public' | 'closed'
  image: string
  #author: string
  #keys = new Set<string>()
  #blocks: Connection[] = $state([])
  #connections = new Set<string>()

  get author() {
    return users.get(this.#author)
  }
  get entries() {
    return this.#blocks.map(conn => conn.get()).filter(e => e !== undefined).sort((a, b) => a.position - b.position)
  }
  get connections() {
    return [...this.#connections.values()].map(slug => channels.get(slug)).filter(e => e !== undefined)
  }
  addConnection(slug: string) {
    this.#connections.add(slug)
  }
  rmConnection(slug: string) {
    return false
  }
  constructor(obj: ChannelI) {
    // const existing = channels.get(`${obj.id}`)
    this.id = `${obj.id}`
    this.title = obj.title
    this.slug = obj.slug
    this.key = this.slug
    this.status = obj.status
    this.description = obj.description
    this.created_at = obj.created_at
    this.updated_at = obj.updated_at
    this.image = obj.image ?? ''
    this.#author = obj.author
    channels.set(this.key, this)
    entries.set(this.key, this)
    console.log(`adding entry ${this.key}`)
    populateUser(this.key, this.#author, 'channels')
  }
  removeEntry(key: Entry["key"]) {
    return false
  }
  addEntry(conn: Connection) {
    if (this.#keys.has(conn.child_id)) return
    this.#keys.add(conn.child_id)
    this.#blocks.push(new Connection(conn))
  }
  get length() {
    return this.#blocks.length
  }
  static fromArena(c: ArenaChannel): ChannelI {
    // const flags = [c.kind] as ChannelParsed['flags']
    // if (c.collaboration) flags.push('collaboration')
    // if (c.published) flags.push('published')

    return {
      id: c.slug,
      title: c.title,
      slug: c.slug,
      description: c.description?.markdown ?? '',
      created_at: new Date(c.created_at).valueOf(),
      updated_at: new Date(c.updated_at).valueOf(),
      status: c.visibility,
      // source: 'arena',
      author: c.owner.slug,
    }
  }
}

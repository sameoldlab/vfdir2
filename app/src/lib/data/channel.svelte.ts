import type { ArenaChannel, ArenaChannelContents, ArenaChannelWithDetails, ArenaUser } from "arena-ts"
import { entries, channels, users, populateUser } from "./maps.svelte"
import type { Child, Collectable, Entry, Collection, User, ArenaConnectionEventData } from "./types"
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
    return Object.assign(child, this) as Child
  }
  static fromArena(data: ArenaConnectionEventData): ConnectionI {
    return {
      key: `${data.parent.id}:${data.child.id}`,
      parent_id: data.parent.slug,
      child_id: data.is_channel === true ? data.child.slug : data.child.id.toString(),
      position: data.position,
      pinned: data.selected ? true : false,
      connected_at: new Date(data.connected_at).valueOf(),
      connected_by: data.child.connected_by_user_slug
    }
  }
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
  status: string
  image: string
  #author: string
  #keys = new Set<string>()
  get author() {
    return users.get(this.#author)
  }
  #blocks: Connection[] = $state([])
  get entries() {
    return this.#blocks.map(conn => conn.get()).sort((a, b) => a.position - b.position)
  }
  #connections = new Set<string>()
  get connections() {
    return [...this.#connections.values()].map(slug => channels.get(slug))
  }
  addConnection(slug: string) {
    this.#connections.add(slug)
  }
  rmConnection(slug: string) {
    return false
  }
  constructor(obj: Channel) {
    this.id = `${obj.id}`
    this.title = obj.title
    this.slug = obj.slug
    this.key = this.slug
    this.status = obj.status
    this.description = obj.description
    this.created_at = obj.created_at
    this.updated_at = obj.updated_at
    this.image = obj.image
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
  static fromArena(c: ArenaChannel | ArenaChannelWithDetails): Channel {
    const flags = [c.kind] as ChannelParsed['flags']
    if (c.collaboration) flags.push('collaboration')
    if (c.published) flags.push('published')

    return {
      id: c.slug,
      type: 'channel',
      title: c.title,
      slug: c.slug,
      created_at: new Date(c.created_at).valueOf(),
      updated_at: new Date(c.updated_at).valueOf(),
      flags,
      status: c.status,
      source: 'arena',
      author: c.user?.slug ?? c.user_id,
    }
  }
}

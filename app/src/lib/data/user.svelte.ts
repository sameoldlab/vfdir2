import type { Collection, Channel, Entry } from "./types"
import { users, channels, entries } from "./maps.svelte"
import type { ArenaUser } from "arena-ts"

export class User implements Collection {
  /** url safe representatnion of user's name */
  type: 'user' = 'user'
  #keys = new Set<string>()
  #channels: Channel['key'][] = $state([])
  #entries: Entry['key'][] = $state([])

  constructor(
    public key: string,
    public name: string,
    public avatar?: string,
  ) {
    users.set(this.key, this)
  }
  static create(
    key: string,
    name: string,
    avatar?: string,
  ) {
    if (users.has(key)) {
      return users.get(key)
    }
    return new User(key, name, avatar)
  }

  addEntry(key: string, type: 'blocks' | 'channels') {
    if (this.#keys.has(key)) return
    this.#keys.add(key)
    if (type === 'channels') this.#channels.push(key)
    this.#entries.push(key)
  }
  removeEntry(key: Entry["key"]) {
    if (!this.#keys.has(key)) return false

    return this.#keys.delete(key)
  }
  get channels() {
    return this.#channels.map(channels.get)
  }
  get entries() {
    return this.#entries.map(entries.get)
  }

  static fromObject({ key, name, avatar }: { key: string, name: string, avatar: string }) {
    return new User(key, name, avatar)
  }
  static fromArena(user: ArenaUser) {
    return {
      key: user.slug,
      name: user.username,
      avatar: user.avatar,
    }
  }
}

// SPDX-License-Identifier: MPL-2.0

import type { Collection, Channel, Entry, Base } from "./types"
import { users, channels, entries } from "./maps.svelte"
import type { ArenaUser } from "$lib/services/arena/types"

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

  static upsert(
    key: string,
    name: string,
    avatar?: string,
  ) {
    const existing = users.get(key)
    if (existing) {
      existing.name = name
      existing.avatar = avatar
      return existing
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
    return this.#channels.map(e => channels.get(e)).filter(e => e !== undefined)
  }
  get entries() {
    return this.#entries.map(e => entries.get(e)).filter(e => e !== undefined)
  }

  static fromObject({ key, name, avatar }: { key: string, name: string, avatar: string }) {
    return new User(key, name, avatar)
  }
  static fromArena(user: ArenaUser) {
    return {
      key: user.slug,
      name: user.name,
      avatar: user.avatar,
    }
  }
}

// SPDX-License-Identifier: MPL-2.0

import type { components } from '$lib/services/arena/schema'
type ArenaBlock = components['schemas']['Block']
import { entries, channels, users, populateUser } from "./maps.svelte"
import type { Collectable } from "./types"
import { User } from "./user.svelte"

type BlockI = Block & { author_slug: User['key'] }

export class Block implements Collectable {
  key: string
  id: string
  title: string = $state('')
  description: string = $state('')
  media?: string | undefined = $state('')
  content?: string | undefined = $state('')
  type: 'text' | 'media' | 'link' | 'attachment'
  created_at: number
  updated_at: number = $state(0)
  filename: string
  provider_url: string
  image: string
  source: string
  attachment: string

  #author: string = ''
  get author() {
    const a = users.get(this.#author)
    if (!a) throw Error(`${this.#author} not found`)
    return a
  }
  #connections = new Set<string>()
  get connections() {
    return [...this.#connections.values()].map(c => channels.get(c)).filter(c => c !== undefined)
  }
  addConnection(slug: string) {
    this.#connections.add(slug)
  }

  constructor(b: BlockI) {
    this.type = b.type
    this.created_at = b.created_at
    this.updated_at = b.updated_at
    this.filename = b.filename
    this.provider_url = b.provider_url
    this.image = b.image
    this.source = b.source
    this.attachment = b.attachment

    this.id = `${b.id}`
    this.key = this.id
    this.title = b.title
    this.description = b.description
    this.media = b.media
    this.content = b.content
    this.#author = b.author_slug
    entries.set(this.key, this)

    populateUser(this.key, this.#author)
  }

  write() {
    return JSON.stringify({
      id: this.id,
      type: this.type,
      title: this.title,
      description: this.description,
      created_at: this.created_at,
      updated_at: this.updated_at,
      content: this.content,
      filename: this.filename,
      provider_url: this.provider_url,
      image: this.image,
      source: this.source,
      author_slug: this.#author,
      attachment: this.attachment,
      connections: [...this.#connections.values()]
    })
  }
  static fromArena(block: ArenaBlock) {
    const data: BlockI = {
      id: block.id.toString(),
      type: block.type.toLowerCase(),
      title: block.title ?? '',
      description: block.description?.markdown ?? '',
      created_at: new Date(block.created_at).valueOf(),
      updated_at: new Date(block.updated_at).valueOf(),
      content: block.type === 'Text' ? block.content.markdown : undefined,
      filename: block.type === 'Attachment' ? block.attachment.url : '',
      provider_url: block.source ? block.source.provider?.url ?? '' : '',
      image: block.image && block.image.original.url,
      source: block.source?.url || '',
      author_slug: block.user.slug,
      attachment: block.attachment?.url
    }

    const user = new User(block.user.slug, block.user.name, block.user.avatar)
    user.addEntry(block.id.toString(), 'blocks')

    // db.exec(`insert or ignore into Providers values (?,?);`, [
    // 	data.source.provider.url,
    // 	data.source.provider.name
    // ])
    return data
  }
}

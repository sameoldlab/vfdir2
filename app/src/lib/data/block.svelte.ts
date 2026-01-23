// SPDX-License-Identifier: MPL-2.0

import type { ArenaBlock } from "$lib/services/arena/types"
import { entries, channels, users, populateUser } from "./maps.svelte"
import type { Collectable } from "./types"
import { User } from "./user.svelte"

type BlockI = {
  id: string,
  author_slug: User['key'],
  title: string,
  description: string,
  media?: string,
  content?: string,
  type: Block['type'],
  created_at: number,
  updated_at: number,
  filename?: string,
  provider_url?: string,
  image?: string,
  source?: string,
  attachment?: string,
}

const ArenaTypes: Readonly<
  Record<components['schemas']['Block']['type'], Block['type']>
> = Object.freeze({
  Text: 'text',
  Image: 'media',
  Link: 'link',
  Embed: 'link',
  Attachment: 'attachment',
})

export class Block implements Collectable {
  key: string
  id: string
  title: string = $state('')
  description: string = $state('')
  media?: string | undefined = $state('')
  content?: string | undefined = $state('')
  // Media and attachment may make sense to merge. One is Media represents file formats directly
  // viewable in a browser, while attachements usually need an external renderer.
  // building additional viwers should not require changing the data type 
  type: 'text' | 'media' | 'link' | 'attachment'
  created_at: number
  updated_at: number = $state(0)
  filename?: string | undefined
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

    const user = users.get(this.#author)
    if (user) user.addEntry(this.key, 'blocks')
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
      type: ArenaTypes[block.type],
      title: block.title ?? '',
      description: block.description?.markdown ?? '',
      created_at: new Date(block.created_at).valueOf(),
      updated_at: new Date(block.updated_at).valueOf(),
      content: block.type === 'Text' ? block.content.markdown : '',
      filename: block.type === 'Attachment' ? block.attachment?.url : '',
      provider_url: block.source?.provider ? block.source.provider.url : '',
      image: block.type !== 'Text' && block.image ? block.image.large.src : undefined,
      source: block.source?.url || '',
      author_slug: block.user.slug,
      attachment: block.type === 'Attachment' ? block.attachment.url : undefined
    }

    new User(block.user.slug, block.user.name, block.user.avatar ?? '')

    // db.exec(`insert or ignore into Providers values (?,?);`, [
    // 	data.source.provider.url,
    // 	data.source.provider.name
    // ])
    return data
  }
}

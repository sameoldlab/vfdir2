import type { ArenaBlock } from "arena-ts"
import { entries, channels, users, populateUser } from "./maps.svelte"
import type { Collectable } from "./types"

export class Block implements Collectable {
  key: string
  id: string
  title: string = $state('')
  description: string = $state('')
  media?: string = $state('')
  content?: string = $state('')
  type: 'text' | 'media' | 'link' | 'attachment'
  created_at: number
  updated_at: number = $state()
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
    return [...this.#connections.values()].map(c => channels.get(c))
  }
  addConnection(slug: string) {
    this.#connections.add(slug)
  }
  rmConnection(slug: string) {
    return false
  }

  constructor(b: Block) {
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
    return {
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
    }
  }
  static fromArena(block: ArenaBlock): Block {
    const data = {
      id: block.id,
      type: block.class.toLowerCase(),
      title: block.title ?? '',
      description: block.description ?? '',
      created_at: new Date(block.created_at).valueOf(),
      updated_at: new Date(block.updated_at).valueOf(),
      content: block.content && block.content,
      filename: block.attachment && block.attachment.content_type,
      provider_url: block.source && block.source.provider.url,
      image: block.image && block.image.original.url,
      source: null,
      author_slug: block.user.slug,
      attachment: block.attachment?.url
    }

    if (block.class === 'Text')
      data.source = block.source ? block.source.url : block.source
    else
      data.source = block.source && block.source.url
    // db.exec(`insert or ignore into Providers values (?,?);`, [
    // 	data.source.provider.url,
    // 	data.source.provider.name
    // ])
    return data
  }
}

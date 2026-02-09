// SPDX-License-Identifier: MPL-2.0

import type { ArenaBlock } from "$lib/services/arena/types"
import { entries, channels, users } from "./maps.svelte"
import type { Collectable } from "./types"
import { User } from "./user.svelte"

export type BlockI = ConstructorParameters<typeof Block>[0]

const ArenaTypes: Readonly<
  Record<ArenaBlock['type'], Block['type']>
> = Object.freeze({
  Text: 'text',
  Image: 'media',
  Link: 'link',
  Embed: 'link',
  Attachment: 'attachment',
})

export class Block implements Collectable {
  key: string
  uid: string
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
  provider_url?: string
  image?: string
  source?: string
  attachment?: string
  _author: string = ''
  _connections = new Set<string>()

  get author() {
    const a = users.get(this._author)
    if (!a) throw Error(`${this._author} not found on ${this}`)
    return a
  }
  get connections() {
    return [...this._connections.values()].map(c => channels.get(c)).filter(c => c !== undefined)
  }
  addConnection(slug: string) {
    this._connections.add(slug)
  }

  constructor(b: {
    key: string,
    author_slug: User['key'],
    uid: string,
    title: string,
    description: string,
    media?: string,
    content?: string,
    type: Block['type'],
    created_at: number,
    updated_at: number,
    filename?: Block['filename'],
    provider_url?: Block['provider_url'],
    image?: Block['image'],
    source?: Block['source'],
    attachment?: Block['attachment'],
  }) {
    Object.assign(this, {
      ...b,
      _author: b.author_slug,
      image: b.image ?? '',
    })

    entries.set(this.key, this)

    const user = users.get(this._author)
    if (user) user.addEntry(this.key, 'blocks')
  }

  write() {
    return {
      uid: this.uid,
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
      author_slug: this._author,
      attachment: this.attachment,
      connections: [...this._connections.values()]
    }
  }
}

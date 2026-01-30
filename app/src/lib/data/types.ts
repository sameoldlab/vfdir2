// SPDX-License-Identifier: MPL-2.0

import type { Channel, ChannelI, Connection, ConnectionI } from "./channel.svelte";
import type { User } from './user.svelte'
import type { Block, BlockI } from './block.svelte'

export type Media = {
  key: string,
  value: string
}
export type Entry = ({ type: 'channel' } & Channel) | Block
export type EntryI = ChannelI | BlockI
export type Service = 'arena' | 'atproto' | 'raindrop'
export interface Base {
  key: string
  /** serialize data for storage */
  // write: () => string
  /** read data from JSON string to create object */
  // read: (value: string) => Base
}

/** object with the ability to contain entries */
export interface Collection extends Base {
  addEntry: (key: ConnectionI | Entry['key'], type?: 'channels' | 'blocks') => void,
  removeEntry: (key: Entry['key']) => boolean,
  entries: Entry[]
  channels?: Channel[]
}

export interface Collectable extends Base {
  addConnection: (key: Collection['key']) => void,
  connections: Channel[]
}

export type { Channel, ChannelI, Connection, ConnectionI, Block, BlockI, User }

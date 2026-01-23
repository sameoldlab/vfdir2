// SPDX-License-Identifier: MPL-2.0

import type { Channel, Connection } from "./channel.svelte";
import type { User } from './user.svelte'
import type { Block } from './block.svelte'

export type Media = {
  key: string,
  value: string
}
export type Entry = ({ type: 'channel' } & Channel) | Block

export interface Base {
  key: string
  /** serialize data for storage */
  // write: () => string
  /** read data from JSON string to create object */
  // read: (value: string) => Base
}

/** object with the ability to contain entries */
export interface Collection extends Base {
  addEntry: (key: Connection | Entry['key'], type?: 'channels' | 'blocks') => void,
  removeEntry: (key: Entry['key']) => boolean,
  entries: Entry[]
  channels?: Channel[]
}

export interface Collectable extends Base {
  addConnection: (key: Collection['key']) => void,
  connections: Channel[]
}

export type { Channel, Connection, Block, User }

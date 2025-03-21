import type { Channel, Connection } from "./channel.svelte";
import type { User } from './user.svelte'
import type { Block } from './block.svelte'
import type { ArenaBlock, ArenaChannel, ArenaChannelContents, ArenaUser, ConnectionData } from "arena-ts";

export type Media = {
  key: string,
  value: string
}
export type Entry = ({ type: 'channel' } & Channel) | Block
export type Child = Connection & Entry
export type Parent = Collection

export type ArenaConnectionEventData = {
  parent: ArenaChannel,
  position: ConnectionData['position'],
  selected: ConnectionData['selected'],
  connected_at: ConnectionData['connected_at'],
  connected_by: ConnectionData['connected_by_user_slug']
} & ({
  is_channel: true
  child: ArenaChannel & ConnectionData,
} | {
  is_channel: false
  child: ArenaBlock & ConnectionData,
}
  )
export interface Base {
  key: string
  /** serialize data for storage */
  write: () => string
  /** read data from JSON string to create object */
  read: (value: string) => Base
}

export interface Collection extends Base {
  addEntry: (key: Connection | Entry['key'], type?: 'channels' | 'blocks') => void,
  removeEntry: (key: Entry['key']) => boolean,
  entries: Entry[]
  channels?: Channel[]
}

export interface Collectable extends Base {
  addConnection: (key: Parent['key']) => void,
  connections: Channel[]
}

export type { Channel, Connection, Block, User }

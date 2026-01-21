import type { components } from './schema'

export type ArenaChannel = components['schemas']['Channel']
export type ArenaBlock = components['schemas']['Block']

/**  content that can be connected to channels (blocks and channels) */
export type ArenaConnectable = components['schemas']['ConnectableList']['data'][number]
export type ArenaUser = components['schemas']['User']

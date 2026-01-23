import type { components } from './schema'

export type ArenaChannel = components['schemas']['Channel']
export type ArenaBlock = components['schemas']['Block']

/**  content that can be connected to channels (blocks and channels) */
export type ArenaEntry = components['schemas']['ConnectableList']['data'][number]
/**
 * Connection context (only present when channel is returned as part of another channel's contents).
 *     Contains position, pinned status, and information about who connected the channel.
 */
export type ArenaConnection = components['schemas']['ConnectionContext']
export type ArenaUser = components['schemas']['User']

// SPDX-License-Identifier: MPL-2.0

import type { DB } from '@vlcn.io/crsqlite-wasm'
import { ev_stmt_close, record_connection, record_entry } from '$lib/database/events'
import type { TXAsync } from '@vlcn.io/xplat-api'
import type { ArenaBlock, ArenaChannel, ArenaConnection, ArenaEntry } from './types'
import { entries, channels } from '$lib/data/maps.svelte'
import type { Block, BlockI, ChannelI, ConnectionI } from '$lib/data/types'

const ArenaTypes: Readonly<
	Record<ArenaBlock['type'], Block['type']>
> = Object.freeze({
	Text: 'text',
	Image: 'media',
	Link: 'link',
	Embed: 'link',
	Attachment: 'attachment',
})

const normalizeConnection = (conn: ArenaConnection, parent_id: string, child_id: string): ConnectionI => ({
	key: '',
	parent_id,
	child_id,
	position: conn.position,
	pinned: conn.pinned,
	connected_at: new Date(conn.connected_at).valueOf(),
	connected_by: conn.connected_by?.slug ?? '',
})

const normalizeEntry = (obj: ArenaEntry) => {
	if (obj.type === 'Channel') {
		const entry: ChannelI = {
			uid: obj.id.toString(),
			type: 'channel',
			key: obj.slug,
			title: obj.title,
			description: obj.description?.markdown ?? '',
			created_at: new Date(obj.created_at).valueOf(),
			updated_at: new Date(obj.updated_at).valueOf(),
			status: obj.visibility,
			author: obj.owner.slug
		}
		return entry
	}

	const entry: BlockI = {
		key: obj.id.toString(),
		author_slug: obj.user.slug,
		uid: obj.id.toString(),
		title: obj.title ?? '',
		description: obj.description?.markdown ?? '',
		type: ArenaTypes[obj.type],
		created_at: new Date(obj.created_at).valueOf(),
		updated_at: new Date(obj.updated_at).valueOf(),
	}
	return entry
}

export async function persistEntries(db: DB | TXAsync, channel: ArenaChannel, aEntries: ArenaEntry[]) {
	console.debug(`recording events with ${entries.size} entries materialized`)

	const conns = channels.get(channel.slug)?.entries.map(e => e.key)
	const promises: Promise<void | void[]>[] = []

	for (const aEntry of aEntries) {
		const entry = normalizeEntry(aEntries)

		promises.push(
			record_entry(db, entry, entries.get(entry.key), {
				service: 'arena',
				updated_at: entry.updated_at
			})
		)

		if (aEntry.connection && !conns?.includes(entry.key)) {
			const conn = normalizeConnection(aEntry.connection, channel.slug, entry.key)
			promises.push(record_connection(db, conn, 'arena'))
		}
	}

	await Promise.all(promises).then(() => ev_stmt_close(db))
}


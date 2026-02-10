// SPDX-License-Identifier: MPL-2.0

import type { DB } from '@vlcn.io/crsqlite-wasm'
import { ev_stmt_close, record_connection, record_entry, record_user } from '$lib/database/events'
import type { TXAsync } from '@vlcn.io/xplat-api'
import type { ArenaBlock, ArenaChannel, ArenaConnection, ArenaEmbedGroup, ArenaEmbedUser, ArenaEntry } from './types'
import { entries, channels, users } from '$lib/data/maps.svelte'
import type { Block, BlockI, ChannelI, ConnectionI, EntryI } from '$lib/data/types'
import { hashObject } from '$lib/utils/hashObject'
import { dev } from '$app/environment'

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

const normalizeEntry = (obj: ArenaEntry, hash: string) => {
	if (obj.type === 'Channel') {
		const entry: ChannelI = {
			uid: hash,
			type: 'channel',
			key: obj.slug,
			title: obj.title,
			description: obj.description?.markdown ?? '',
			created_at: new Date(obj.created_at).valueOf(),
			updated_at: new Date(obj.updated_at).valueOf(),
			status: obj.visibility,
			author_slug: obj.owner.slug
		}
		return entry
	}

	const entry: BlockI = {
		key: obj.id.toString(),
		author_slug: obj.user.slug,
		uid: hash,
		title: obj.title ?? '',
		description: obj.description?.markdown ?? '',
		type: ArenaTypes[obj.type],
		created_at: new Date(obj.created_at).valueOf(),
		updated_at: new Date(obj.updated_at).valueOf(),
	}
	switch (obj.type) {
		case 'Text':
			entry.content = obj.content.markdown
			break
		case 'Link':
			entry.content = obj.content?.markdown ?? ''
			entry.image = obj.image?.large.src
			break
		case 'Attachment':
			entry.attachment = obj.attachment.url
			entry.filename = obj.attachment.filename ?? undefined
			// entry.file_size = obj.attachment.file_size
			entry.image = obj.image?.large.src
			break
		case 'Embed':
	}
	entry.image = obj.image?.large.src ?? ''
	entry.source = obj.source?.url
	entry.provider_url = obj.source?.provider?.url

	return entry
}
export function normalizeUser(user: ArenaEmbedUser | ArenaEmbedGroup) {
	return {
		name: user.name,
		key: user.slug,
		avatar: user.avatar ?? ''
	}
}

export async function persistEntries(db: DB | TXAsync, channel_slug: ArenaChannel['slug'] | undefined, aEntries: ArenaEntry[]) {
	console.debug(`recording ${aEntries.length} events with ${entries.size} entries materialized`)

	const conns = channels.get(channel_slug ?? '')?.entries.map(e => e.key) ?? []
	const promises: Promise<boolean>[] = []
	const aUsers: string[] = []

	for (const aEntry of aEntries) {
		const hash = hashObject(aEntry)
		let entry: EntryI
		if (typeof hash === 'string') entry = normalizeEntry(aEntry, hash)
		else entry = normalizeEntry(aEntry, await hash)

		const user = aEntry.type === 'Channel'
			? normalizeUser(aEntry.owner)
			: normalizeUser(aEntry.user)

		if (!users.get(user.key) && !aUsers.includes(user.key)) {
			aUsers.push(user.key)
			promises.push(record_user(db, user))
		}

		promises.push(
			record_entry(db, entry, entries.get(entry.key), {
				service: 'arena',
				updated_at: entry.updated_at
			})
		)

		if (channel_slug && aEntry.connection && !conns?.includes(entry.key)) {
			if (aEntry.connection.connected_by) {
				const user = normalizeUser(aEntry.connection.connected_by)
				if (!users.get(user.key) && !aUsers.includes(user.key)) {
					aUsers.push(user.key)
					promises.push(record_user(db, user))
				}
			}
			const conn = normalizeConnection(aEntry.connection, channel_slug, entry.key)
			promises.push(record_connection(db, conn, 'arena'))
		}
	}

	const results = await Promise.all(promises)
	await ev_stmt_close(db)
	if (dev) console.debug(`recorded ${results.filter(r => r).length} events from ${aEntries.entries.length} entries`)
}


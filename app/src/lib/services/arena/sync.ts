// SPDX-License-Identifier: MPL-2.0

import type { DB } from '@vlcn.io/crsqlite-wasm'
import { arena_entry_sync, arena_connection_import, ev_stmt_close } from '$lib/database/events'
import type { TXAsync } from '@vlcn.io/xplat-api'
import type { ArenaChannel, ArenaEntry } from './types'
import { entries, channels } from '$lib/data/maps.svelte'

export async function persistEntries(db: DB | TXAsync, channel: ArenaChannel, newEntries: ArenaEntry[]) {
	console.debug(`recording events with ${entries.size} entries materialized`)

	const conns = channels.get(channel.slug)?.entries.map(e => e.id)
	const promises: Promise<void | void[]>[] = []

	for (const entry of newEntries) {
		const key = entry.type === 'Channel' ? entry.slug : `${entry.id}`
		promises.push(
			arena_entry_sync(db, entry, entries.get(key))
		)

		if (entry.connection && !conns?.includes(key)) {
			promises.push(
				arena_connection_import(db, channel, entry)
			)
		}
	}

	await Promise.all(promises).then(() => ev_stmt_close(db))
}

export async function persistChannel(db: DB | TXAsync, newEntries: ArenaChannel[]) {
	console.debug(`recording events with ${channels.size} channels materialized`)

	await Promise.all(
		newEntries.map((entry) => arena_entry_sync(db, entry, channels.get(entry.slug)))
	).then(() => ev_stmt_close(db))
}


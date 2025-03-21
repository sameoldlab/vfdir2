// SPDX-License-Identifier: MPL-2.0

import type { DB } from '@vlcn.io/crsqlite-wasm'
import type { ArenaChannelWithDetails } from 'arena-ts'
import { arena_entry_sync, arena_connection_import, ev_stmt_close } from '$lib/database/events'
import type { TXAsync } from '@vlcn.io/xplat-api'
import { entries, channels } from '$lib/data/maps.svelte'

export async function pullArena(db: DB | TXAsync, ...aChannels: ArenaChannelWithDetails[]) {
	const dedupe = {
		entries: new Map(entries),
		conns: channels.entries().reduce((acc, [k, v]) => {
			if (!acc.has(k)) acc.set(k, new Set())
			v.entries.forEach(b => { acc.get(k).add(b.key) })
			return acc
		}, new Map<string, Set<string>>())
	}
	if (dedupe.entries.size === 0) { console.warn(`recording events with 0 entries in dedupe`) }

	const promises: Promise<void>[] = []
	const add = (p: Promise<void>) => promises.push(p)

	for (const chan of aChannels) {
		let currentChan = dedupe.entries.get(chan.slug)
		if (!currentChan) dedupe.entries.set(chan.slug, chan)
		add(arena_entry_sync(db, chan, currentChan))

		if (!chan.contents) continue
		for (const bl of chan.contents) {
			const key = bl.base_class === 'Channel' ? bl.slug : bl.id.toString()
			const currentBlock = dedupe.entries.get(key)
			if (!currentBlock) dedupe.entries.set(key, bl)
			add(arena_entry_sync(db, bl, currentBlock))

			const conn = dedupe.conns.get(chan.slug)
			if (conn) {
				if (conn.has(key)) continue
				add(arena_connection_import(db, chan, bl))
				conn.add(key)
			} else {
				add(arena_connection_import(db, chan, bl))
				dedupe.conns.set(key, new Set())
			}
		}
	}
	await Promise.all(promises).then(() => {
		ev_stmt_close(db)
	})
}

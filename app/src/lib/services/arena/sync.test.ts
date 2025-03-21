import initWasm from '@vlcn.io/crsqlite-wasm'
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { initStore } from '$lib/database/createTables'
import { bootstrap } from '$lib/database/watchEvents'
import { arenaChannels as mockChannels } from '$lib/dummy/channels'
import duplicateChans from '$lib/dummy/duplicateChans'
import { pullArena } from './sync'
import { DbPool } from '$lib/database/connectionPool.svelte'

const tdb = new DbPool({ dbName: 'test' })
describe('Bootstrap database', async () => {
	beforeAll(() => {
		tdb.exec(async (tx) => {
			await initStore(tx)
			// pullArena(tx, ...arenaChannels)
		})
	})

	// reinserting the same data does not duplicate rows
	it('does not duplicate inserts', async () => {
		console.time('parse')
		tdb.exec(async (db) => {
			await pullArena(db, ...mockChannels)
			console.timeEnd('parse')
			const length1 = (await db.execA('select count(*) from Blocks;'))[0][0];

			const totalUniques = mockChannels.reduce((r, c) => {
				r.add(c.id)
				c.contents && c.contents.forEach((b) => r.add(b.id))
				return r
			}, new Set())

			console.time('parse double')
			await pullArena(db, ...mockChannels)
			console.timeEnd('parse double')
			const length2 = (await db.execA('select count(*) from Blocks;'))[0][0];

			expect(length1).toEqual(totalUniques.size)
			expect(length2).toEqual(totalUniques.size)
		})
	})
})

describe('Deduplication and sync', async () => {

	beforeAll(() => {
		tdb.exec(async (tx) => {
			await initStore(tx)
			// pullArena(tx, ...arenaChannels)
		})
	})

	/* it('skips repeated blocks', async () => {
tdb.exec(async (db) => {
		await pullArena(db, ...duplicateChans)

		expect(bLen).toEqual(2)
		expect(cLen).toEqual(1)
		expect(uLen).toEqual(2)
		expect(pLen).toEqual(1)
	})
}) */
})

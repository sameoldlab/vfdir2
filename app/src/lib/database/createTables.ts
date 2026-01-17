// SPDX-License-Identifier: MPL-2.0

import type { DB } from "@vlcn.io/crsqlite-wasm"
import type { TXAsync } from "@vlcn.io/xplat-api"

export async function initStore(db: DB | TXAsync) {
	if (
		localStorage.getItem('deviceId') === null
		|| (await db.execA(`SELECT name FROM sqlite_master WHERE type='table' AND name='log';`)).length === 0
	) {

		if (!localStorage.getItem('deviceId')) {
			const { ulid } = await import('ulidx')
			localStorage.setItem('deviceId', ulid())
		}
		console.log('Initializing database...')
		const { schema } = await import('$lib/database/schema')

		schema.push(`INSERT INTO Users(id) VALUES ('${localStorage.getItem('deviceId')}');`)
		await db.execMany(schema)
	}
	return
}

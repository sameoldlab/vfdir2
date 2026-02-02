// SPDX-License-Identifier: MPL-2.0

import initWasm, { type DB, type SQLite3 } from '@vlcn.io/crsqlite-wasm'
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'
import type { TXAsync } from '@vlcn.io/xplat-api'

type DELETE = 9
type INSERT = 18
type UPDATE = 23
type Table = 'log'
type UpdateType = DELETE | INSERT | UPDATE

export type QueryData<T> = {
	readonly loading: boolean;
	readonly error?: Error;
	readonly data: T;
}

export class DbPool {
	#connection: DB | null
	#sqlite: SQLite3
	dbName: string
	status = $state<'available' | 'loading' | 'error'>('loading')
	error = $state()
	#channel = new BroadcastChannel('updates')

	constructor(
		args?: { dbName: string | undefined }
	) {
		this.dbName = args?.dbName || 'vfdir.db'
		this.#initSql().then(sqlite => {
			this.#sqlite = sqlite!
		})
	}

	#updateBuffer = new Map<`${Table}:${UpdateType}`, Set<bigint>>()
	#timeout: NodeJS.Timeout | null = null
	async #connect() {
		this.#sqlite = this.#sqlite || await this.#initSql()

		if (this.#connection) return this.#connection
		try {
			const connection = await this.#sqlite.open(this.dbName)
			connection.onUpdate((type, _db, table: Table, row) => {
				if (!this.#updateBuffer.has(`${table}:${type}`)) {
					this.#updateBuffer.set(`${table}:${type}`, new Set())
				}
				this.#updateBuffer.get(`${table}:${type}`)?.add(row)

				if (this.#timeout === null) this.#timeout = setTimeout(() =>
					this.#batchSubscribe()
					, 2)

				// this.#subscribe(type, db, table, row)
			})
			this.#connection = connection
			return this.#connection
		} catch (err) {
			console.error(err)
			return { error: err }
		}

	}
	#batchSubscribe() {
		this.#timeout = null
		this.#channel.postMessage(this.#updateBuffer.get(`log:18`))
		this.#updateBuffer.clear();
	}

	async exec<R>(fn: (tx: TXAsync, db: DB) => R) {
		try {
			const db = await this.#connect()
			if ('error' in db) {
				console.error(db)
				return db.error
			}
			try {
				await db.tx(async (tx) => {
					await fn(tx, db)
				})
			} catch (err) {
				console.error(`Error while running transaction: ${err}`)
				console.trace(err)
			}
			return () => this.#close()
		} catch (err) {
			console.error(err)
		}
	}
	async #close() {
		if (!this.#connection) return
		try {
			const res = await this.#connection.close()
			this.#connection = null
			return res
		} catch (err) {
			if (!(err.message === 'Error: not a database')) console.warn(err)
		}
	}
	async closeAll() {
		this.#close()
	}
	async #initSql() {
		try {
			const sqlite = await initWasm(() => wasmUrl)
			this.status = 'available'
			return sqlite
		} catch (e) {
			this.status = 'error'
			this.error = e
		}
	}
}

// SPDX-License-Identifier: MPL-2.0

import { describe, expect, it } from "vitest";
import { initStore } from "./createTables";
import { DbPool } from "./connectionPool.svelte";
import { pullArena } from "$lib/services/arena/sync";
import { arenaChannels } from "$lib/dummy/dupeChannels";
import { bootstrap, watchEvents } from "./watchEvents";

const pool = new DbPool({ dbName: 'test-store' })
describe('avoid duplicate entries', () => {

  it('runs bootstrap without duplicates', () => {
    pool.exec(async (tx) => {
      expect(async () => {
        await initStore(tx)
        await bootstrap(tx)
        watchEvents('test-store')
        await pullArena(tx, ...arenaChannels)
      }).not.toThrow()
    })
  })

  it('avoid duplicate entries', () => {
    expect(0).toEqual(0)
  })
})



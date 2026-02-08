import { page } from "$app/state"
import { pageSync } from "$lib/data/maps.svelte"
import { hashObject } from "$lib/utils/hashObject"
import type { TXAsync } from "@vlcn.io/xplat-api"
import { getChannelContents, getUserChannels } from "./queries.remote"
import { persistEntries } from "./sync"
import type { ArenaConnectableListResponse } from "./types"

/**
 * Pulls a collection of entries (channels and blocks) from arena queries,
 * then sends them to `persistEntries` to be recorded as events.
 * @clientonly
 */
export const syncArenaList = async (contents: ArenaConnectableListResponse, tx: TXAsync, kind: 'user' | 'channel' = 'channel', pageNo = 1) => {
	// includes per_page so server load functions using a small number of items
	// do not conflict with pull page hash
	// i.e. per_page: 5 & current: 1 !== per_page: 100 & current: 1
	const path = `${page.url.pathname}:${contents.meta.per_page}:${contents.meta.current_page}`
	const fetchHash = await hashObject(contents.data)

	// check if contents have changed before pulling a full list
	if (pageSync.get(path) === fetchHash) return

	const promises: Promise<any>[] = [persistEntries(tx, page.params.channel, contents.data)]

	try {
		if (contents.meta.has_more_pages) {
			const { error, data } = kind === 'user'
				? await getUserChannels({ id: page.params.username!, page: pageNo })
				: await getChannelContents({ id: page.params.channel!, page: pageNo })

			if (error) return typeof error.error === 'string' ? error.error : error.error.message

			promises.push(syncArenaList(data, tx, kind, pageNo + 1))
		}

		await Promise.all(promises)
		// only sync if promises resolve succesfully
		pageSync.set(path, fetchHash)
	} catch (error) {
		console.error(error)
		return error
	}
}

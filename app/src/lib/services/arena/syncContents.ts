import { page } from "$app/state"
import { pageSync } from "$lib/data/maps.svelte"
import { hashObject } from "$lib/utils/hashObject"
import type { TXAsync } from "@vlcn.io/xplat-api"
import { getChannelContents } from "./queries.remote"
import { persistEntries } from "./sync"
import type { ArenaConnectableListResponse } from "./types"

export const syncArenaChannel = async (contents: ArenaConnectableListResponse, tx: TXAsync, pageNo = 1) => {
	// this includes items per page to allow using a smaller fetch for the initial check
	// per_page: 5 & current: 1 !== per_page: 50 current: 1
	const path = `${page.url.pathname}:${contents.meta.per_page}:${contents.meta.current_page}`
	const fetchHash = await hashObject(contents.data)

	// check if contents have changed before pulling a full list
	if (pageSync.get(path) === fetchHash) return

	const promises: Promise<any>[] = []
	promises.push(persistEntries(tx, page.params.channel, contents.data))

	try {
		const { error, data } = await getChannelContents({
			id: page.params.channel!,
			page: pageNo,
		})

		if (error) {
			return typeof error.error === 'string' ? error.error : error.error.message
		}

		if (data.meta.has_more_pages) promises.push(syncArenaChannel(data, tx, pageNo + 1))
		else promises.push(persistEntries(tx, page.params.channel, data.data))

		pageSync.set(path, fetchHash)
		await Promise.all(promises)
	} catch (error) {
		console.error(error)
		return error
	}
}

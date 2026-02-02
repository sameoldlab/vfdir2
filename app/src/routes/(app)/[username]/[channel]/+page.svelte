<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { page } from '$app/state'
	import View from '$lib/components/view.svelte'
	import { channels } from '$lib/data/maps.svelte'
	import { channelContents } from '$lib/services/arena/queries.remote'
	import { persistChannels } from '$lib/services/arena/sync'
	import { getPool } from '$lib/stores.svelte'
	import type { Snapshot } from '@sveltejs/kit'


	const channel = $derived(channels.get(page.params.channel!))
	let errorMsg = $state('')

	const syncContents = async (pageNo = 1) => {
		const { error, data } = await channelContents({
			id: page.params.channel!,
			page: pageNo
		})
		if (error) {
			errorMsg =
				typeof error.error === 'string' ? error.error : error.error.message
			return
		}
		const promises: Promise<void>[] = []
		const pool = getPool()
		// promises.push(pool.exec(async (tx) => await persistChannel(tx, data.data)))
		if (data.meta.has_more_pages) promises.push(syncContents(pageNo + 1))
		await Promise.all(promises)
	}

	const scroll = (init = 0) => {
		let val = $state(init)
		return {
			get val() {
				return val
			},
			set val(v) {
				val = v
			}
		}
	}
	let y = scroll(0)
	export const snapshot: Snapshot<number> = {
		capture() {
			return y.val
		},
		restore(value) {
			y.val = value
		}
	}
</script>

{#if !channel}
	<div class="error">Channel not cached. Fetching...</div>
{:else if channel.entries.length === 0}
	<div class="error">
		<p>Channel is empty.</p>
		<br />
		Searching arena for a matching channel...
		<p>
			or... make one of your o-- <span class="text-4"
				>sorry! haven't built this part yet</span
			>
		</p>
	</div>
{:else}
	<View data={channel.entries} {y} />
{/if}

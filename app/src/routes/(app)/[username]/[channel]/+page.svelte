<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { page } from '$app/state'
	import View from '$lib/components/view.svelte'
	import { channels } from '$lib/data/maps.svelte'
	import { syncArenaList } from '$lib/services/arena/syncContents'
	import { persistEntries } from '$lib/services/arena/sync'
	import { getPool } from '$lib/stores.svelte'
	import type { Snapshot } from '@sveltejs/kit'

	const { data } = $props()
	const channel = $derived(channels.get(page.params.channel!))

	$effect(() => {
		if (!data.channel || !data.contents) return

		getPool().exec(async (tx) => {
			if (!data.channel || !data.contents) return
			await persistEntries(tx, page.params.channel, [data.channel])
			await syncArenaList(data.contents, tx)
		})
	})

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

<svelte:head>
	<title>{channel?.title ? channel.title + ' | ' : ''}vfdir</title>
</svelte:head>

{#if channel}
	{#if channel.entries.length === 0}
		<div class="error">
			<p>No entries saved</p>
			<br /> Pulliing entries from arena...
		</div>
	{:else}
		<View data={channel.entries} {y} />
	{/if}
{:else}
	{#if data.error}
		{data.error.error}
	{/if}
	<div class="error">Channel not cached. Fetching...</div>
{/if}

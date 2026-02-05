<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { page } from '$app/state'
	import BlockDetails from '$lib/components/BlockDetails.svelte'
	import { entries, users } from '$lib/data/maps.svelte'
	import { getPool } from '$lib/stores.svelte.js'
	import { persistEntries } from '$lib/services/arena/sync.js'
	import { record_user } from '$lib/database/events.js'

	const { data } = $props()
	const block = $derived(entries.get(page.params.id!))
	
	$effect(() => {
		if (!data.block || block) return

		getPool().exec(async (tx) => {
			const u = data.block?.user
			// maybe just put this under a [username] route to skip repeating the user persistence code? 
			if (u && !users.get(u?.slug))
				await record_user(tx, {
					key: u?.slug,
					name: u?.name,
					avatar: u?.avatar ?? ''
				})
			return persistEntries(tx, undefined, [data.block])
		})
	})
</script>

{#if block}
	<BlockDetails {block} />
{:else if data.block}
	caching block...
{:else}
	<div class="error">
		<h1>Error</h1>
		{#if data.error}
			{#if 'code' in data.error}
				{#if data.error.code === 404}
					The block {page.params.id} does not exist in are.na <br />
				{:else if data.error.code === 401 || data.error.code === 403}
					<p>You do not have permission to access this block.</p>
					<a class="link" href="/accounts">Connect your are.na account</a>
				{/if}
			{:else}
				Rate limit exceeded
			{/if}
		{:else}
			<p>No entry found for id: <code>{page.params.id}</code></p>
			<p>Attempting fetch from are.na</p>
		{/if}
	</div>
{/if}

<style>
	div {
		overflow-y: auto;
		height: 100%;
	}
</style>

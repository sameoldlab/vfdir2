<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { page } from '$app/state'
	import BlockDetails from '$lib/components/BlockDetails.svelte'
	import {  entries } from '$lib/data/maps.svelte'

	const { data } = $props()

	const key = $derived(`${page.params.username}/${page.params.type}/${page.params.key}`)
	const block = $derived(entries.get(key))

</script>
<div>
	{#if block}
		<BlockDetails {block} />
	<!-- {:else if data.block}
		caching block... -->
	{:else}
		<div class="error">
			<h1>Error</h1>
			{#if data.error}
				{#if 'code' in data}
					{#if data.code === 404}
						The block {page.params.id} does not exist in are.na <br />
					{:else if data.code === 401 || data.code === 403}
						<p>You do not have permission to access this block.</p>
						<a class="link" href="/accounts">Connect your are.na account</a>
					{/if}
				{/if}
			{:else}
				<p>No entry found for id: <code>{page.params.id}</code></p>
				<p>Attempting fetch from pds</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	div {
		overflow-y: auto;
		height: 100%;
	}
</style>

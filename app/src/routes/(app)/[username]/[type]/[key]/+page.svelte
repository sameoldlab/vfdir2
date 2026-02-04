<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { page } from '$app/state'
	import BlockDetails from '$lib/components/BlockDetails.svelte'
	import PrettyObj from '$lib/components/PrettyObj.svelte'
	import { entries } from '$lib/data/maps.svelte'
	import { persistCosmikEntries } from '$lib/services/atpro/sync.js'
	import { getPool } from '$lib/stores.svelte.js'

	const { data } = $props()

	const key = $derived(
		`${page.params.username}/${page.params.type}/${page.params.key}`
	)
	const block = $derived(entries.get(key))

	$effect(() => {
		// if block has not been saved or saved version is different from fetched data
		if ((!block && data.knownCard && data.record) || (block && block.uid !== data.record.cid))
			getPool().exec(async (tx) => persistCosmikEntries(tx, [data.record]))
	})
</script>

{#if block}
	<div>
		<BlockDetails {block} />
	</div>
{:else}
	<div class="error">
		{#if data.error}
			{#if data.error.error = 'RecordNotFound'}
				<h1>Entry not found</h1>
					No record exists with id: at://{key}.
				{:else}
			<h1>Error: <code>{data.error.error}</code></h1>
			{data.error.message}
				{/if}
		{:else if !data.record}
			<h1>Error</h1>
			<p>No entry found for <code>{key}</code></p>
			<p>Attempting fetch from pds</p>
		{:else if data.record && !data.knownCard}
			<h1>Cannot parse record</h1>
			<p>
				There is no parser for {data.record.value.$type} records yet. If you think
				this would be a useful entry, please
				<a target="_blank" href="https://github.com/sameoldlab/vfdir2/issues"
					>open an issue in vfdir</a
				> to discuss.
			</p>
			<div class="code">
				<PrettyObj data={data.record} />
			</div>
		{/if}
	</div>
{/if}

<style>
	div:not(.error) {
		overflow-y: auto;
		height: 100%;
	}
	div.code {
		padding: 1rem;
		margin-block: 1.5rem;
		background-color: var(--b2);
		overflow-y: auto;
		border-radius: 4px;
		height: fit-content;
		max-height: 500px;
	}
</style>

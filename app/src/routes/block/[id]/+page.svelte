<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { page } from '$app/state'
	import BlockDetails from '$lib/components/BlockDetails.svelte'
	import { entries } from '$lib/data/maps.svelte'
	const block = $derived(entries.get(page.params.id))
</script>

<div>
	<BlockDetails {block} />
</div>

<style>
	div {
		overflow-y: scroll;
		height: 100%;
	}
</style>

<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import type { Block, Channel } from '$lib/data/types'
	import BlockTypeCard from '$lib/components/BlockTypeCard.svelte'
	let {
		raw = false,
		...content
	}: (Block | Channel)[] & {
		raw: boolean
	} = $props()
</script>

<div class="grid" class:raw>
	{#each content as c, i (c._id)}
		<BlockTypeCard {...c} />
	{/each}
</div>

<style>
	.grid {
		--size: 260px;
		display: grid;
		gap: 1em;
		grid-template-columns: repeat(auto-fill, minmax(var(--size), 1fr));
		padding: 1rem;
		box-sizing: border-box;
	}
	.raw {
		padding: 0;
	}
	div {
		display: block;
	}
</style>

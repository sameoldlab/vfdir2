<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { VIEWS } from '$lib/stores.svelte'
	import block from './svg/block.svelte'
	import miller from './svg/miller.svelte'
	import table from './svg/table.svelte'
	import canvas from './svg/canvas.svelte'
	import AddChannel from './addChannel.svelte'
	import Omnibar from './omnibar.svelte'
	import { pageview } from '$lib/utils/pageView.svelte'
	import { slide } from 'svelte/transition'
	import type { KeyboardEventHandler } from 'svelte/elements'

	const viewIcons = [block, miller, table, canvas]
	const addChannelId = 'addChannel'
	// let popover: HTMLElement = $state()
	const handleKeybind: KeyboardEventHandler<HTMLElement> = (e) => {
		if (e.target !== document.body) return
		switch (e.key) {
			case 'n': {
					console.log(e)
					const popover = document.getElementById(addChannelId)
					if (!popover) return
					popover.showPopover()
					e.preventDefault()
				}	break
			case '/':
				{
					// search
				}
				break
		}
	}
</script>

<AddChannel id={addChannelId} />
<svelte:body onkeydown={handleKeybind} />

<header in:slide={{ duration: 200 }}>
	<div class="main">
		{#each VIEWS as view, i}
			{@const Icon = viewIcons[i]}
			<button
				class="label"
				class:selected={pageview.v === view}
				onclick={() => (pageview.v = view)}
				aria-label={view}
			>
				<Icon />
			</button>
		{/each}
	</div>
	<nav>
		<!-- {#if inChannel}
			<div class="section">
				<span class="label">updated: </span>
				{new Date(data.created_at ?? 0)?.toLocaleDateString()}
			</div>
			<div class="section">
				{data.size} <span class="label">items</span>
			</div>
		{/if}
		<Omnibar />
		-->
	</nav>
	<div class="main">
		<button class="text-6" popovertarget={addChannelId} onclick={() => {}}
			>+ New<kbd>N</kbd></button
		>
		<a href="/accounts" class="text-6">Accounts</a>
	</div>
</header>

<style>
	header {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 2ch;
		top: 0;
		left: 0;
		right: 0;
		padding-inline: 1em;
		grid-row: header-start / header-end;
		grid-column: full-start / full-end;
		background: var(--b1);

		font-weight: 400;
		z-index: 99;
	}

	.label {
		height: 1.5rem;
		width: 1.5rem;
		padding: 0;
		:global(svg) {
			height: 100%;
			width: 100%;
		}
	}
	nav {
		display: flex;
		gap: 0.5rem;
	}
	.main {
		display: flex;
		gap: 0.375rem;
		align-items: center;
		border-radius: 1rem;
		& * {
			font-size: 0.85rem;
			line-height: 100%;
		}
	}
</style>

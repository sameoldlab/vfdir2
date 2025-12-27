<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import '../app.css'
	import Header from '$lib/components/header.svelte'
	import { initStore } from '$lib/database/createTables'
	import { pool } from '$lib/database/connectionPool.svelte'
	import { onMount } from 'svelte'
	import { beforeNavigate } from '$app/navigation'
	import { setTree } from '$lib/stores.svelte'
	import { fade } from 'svelte/transition'
	import { entries } from '$lib/data/maps.svelte'
	import { pullArena } from '$lib/services/arena/sync'
	import { arenaChannels } from '$lib/dummy/dupeChannels'
	let { children } = $props()

	const tree = $state([])
	setTree(tree)

	beforeNavigate((nav) => {
		switch (nav.type) {
			case 'link':
				if (nav.from.route.id === '/') {
					tree.length = 0
					tree[0] = [nav.from]
				} else tree.push(nav.from)
				break
			case 'popstate':
				if (nav.to.url.href === tree.at(-1)?.url.href) tree.pop()
				else tree.push(nav.from)
		}
	})

	let ready = $state(true)
	onMount(() => {
		pool.exec(async (tx) => {
			await initStore(tx)
			const { watchEvents, bootstrap } =
				await import('$lib/database/watchEvents')
			watchEvents()
			await bootstrap(tx)
			pullArena(tx, ...arenaChannels)
			console.log('ready')
			ready = true
		})
	})
</script>

<Header />
<div id="padheader"></div>
{#if pool.status === 'error'}
	<div class="error">{pool.error}</div>
{:else if pool.status === 'loading' || !ready}
	<div in:fade={{ duration: 200 }}>
		<p>Creating visually fluid dispensaries...</p>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	:global(div#contents) {
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;
		height: 100vh;
	}
	#padheader {
		height: 2.125rem;
		height: 0px;
		position: relative;
	}
	div {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100svh;
		p {
			color: var(--b6);
			font-weight: 500;
			animation: pulse 5s infinite ease-in-out;
			text-shadow: 0 0 16px var(--b5);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0;
			text-shadow: 0 0 0px var(--b5);
			color: var(--b5);
		}
		45% {
			opacity: 1;
			text-shadow: 0 0 16px var(--b6);
			color: var(--b7);
		}
	}
</style>

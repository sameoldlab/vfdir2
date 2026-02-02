<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import Header from '$lib/components/header.svelte'
	import { initStore } from '$lib/database/createTables'
	import { DbPool } from '$lib/database/connectionPool.svelte'
	import { onDestroy, onMount } from 'svelte'
	import { beforeNavigate } from '$app/navigation'
	import { getPool, setPool, setTree } from '$lib/stores.svelte'
	import { bootstrap, parseEvent } from '$lib/database/watchEvents'
	import type { NavigationTarget } from '@sveltejs/kit'
	let { children } = $props()

	const tree: NavigationTarget[] = $state([])
	setTree(tree)
	setPool(new DbPool())

	beforeNavigate((nav) => {
		switch (nav.type) {
			case 'link':
				if (nav.from?.route.id === '/') {
					tree.length = 0
					tree[0] = [nav.from]
				} else tree.push(nav.from)
				break
			case 'popstate':
				if (nav.to.url.href === tree.at(-1)?.url.href) tree.pop()
				else tree.push(nav.from)
		}
	})

	let channel: BroadcastChannel | null
	let ready = $state(false)
	onMount(() => {
		const pool = getPool()
		console.debug('bootstrapping...')
		pool.exec(async (tx) => {
			await initStore(tx)
			await bootstrap(tx)
			console.log('All is steady')
			ready = true
		})

		channel = new BroadcastChannel('updates')
		channel.onmessage = (ev) => {
			if (ev.data) {
				const ub: bigint[] = [...ev.data.values()]
				console.log({ ub, start: ub[0], end: ub.at(-1) })
				pool.exec(async (tx) => {
					const events = await tx.execO(
						'select *,rowid from log where rowid between ? and ?',
						[ub[0]!, ub.at(-1)!]
					)
					console.debug(`reading ${events.length} events live`)
					parseEvent(events)
					console.error('FINISH THE PERSIST FUNCTION!!')
					// persistData().then(() => lastRow.current = ub.at(-1)!)
				})
				// .catch((err) => { console.error(err) })
			}
		}
	})

	onDestroy(() => {
		channel?.close()
	})
</script>

<Header />
<div id="padheader"></div>
{#if ready}
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

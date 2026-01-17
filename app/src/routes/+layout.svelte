<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { env } from '$env/dynamic/public'
	import { onMount } from 'svelte'
	import '../app.css'
	import { setupConvex } from 'convex-svelte'
	import { pool } from '$lib/database/connectionPool.svelte'
	import { initStore } from '$lib/database/createTables'
	import { watchEvents, bootstrap } from '$lib/database/watchEvents'
	let { children } = $props()

	// setupConvex(env.PUBLIC_CONVEX_URL)
	let ready = $state(false)
	onMount(() => {
		console.debug('bootstrapping...')
		pool.exec(async (tx) => {
			await initStore(tx)
			// const { watchEvents, bootstrap } =
			// 	await import('$lib/database/watchEvents')
			watchEvents()
			await bootstrap(tx)
			ready = true
		})
	})
</script>
{ready}
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
</style>

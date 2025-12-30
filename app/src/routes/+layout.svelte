<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import '../app.css'
	import { setupConvex } from 'convex-svelte'
	import { PUBLIC_CONVEX_URL } from '$env/static/public'

	let { children } = $props()

	setupConvex(PUBLIC_CONVEX_URL)
</script>

	{@render children()}

<style>
	:global(div#contents) {
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;
		height: 100vh;
	}
</style>

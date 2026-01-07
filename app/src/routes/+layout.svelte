<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { env } from '$env/dynamic/public'
	import '../app.css'
	import { setupConvex } from 'convex-svelte'
	let { children } = $props()

	setupConvex(env.PUBLIC_CONVEX_URL)
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

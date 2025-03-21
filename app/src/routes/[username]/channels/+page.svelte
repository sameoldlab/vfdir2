<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { page } from '$app/state'
	import GridView from '$lib/components/views/GridView.svelte'
	// import { getContents as getArenaContents } from '$lib/store/arena-apiv2.svelte.js'

	const { username } = page.params
	console.log(username)

	// getArenaContents(channel).then(data => {		console.log(data)	})
</script>

<h1>Channels</h1>

{username}

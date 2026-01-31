<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { users } from '$lib/data/maps.svelte.js'
	import { pool } from '$lib/database/connectionPool.svelte.js'
	import { record_user } from '$lib/database/events.js'
	import { setRouteCtx, type RouteCtx } from '$lib/stores.svelte'

	let { children, data } = $props()
	const routeCtx: RouteCtx = $derived({
		service: data.service,
		user: data.user
	})
	setRouteCtx(routeCtx)

	$effect(() => {
		if (data.user.key && !users.has(data.user.key)) {
			console.log('trigger trigger, pull my finger')
			pool.exec(async (db) =>
				record_user(db, {
					name: routeCtx.user.name,
					key: routeCtx.user.key
				})
			)
		}
	})
</script>

{@render children()}

<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import View from '$lib/components/view.svelte'
	import { users } from '$lib/data/maps.svelte'
	import { ev_stmt_close, record_user } from '$lib/database/events.js'
	import { persistChannels } from '$lib/services/arena/sync.js'
	import {
		persistCosmikConnections,
		persistCosmikEntries
	} from '$lib/services/atpro/sync.js'
	import { getPool, getRouteCtx } from '$lib/stores.svelte.js'
	import type { Snapshot } from '@sveltejs/kit'
	import { untrack } from 'svelte'

	const ctx = getRouteCtx()
	const pool =  getPool()
	const { data } = $props()
	const user = $derived(users.get(ctx.user?.key))

	let error: string | undefined = $state()
	const contents = $derived(await data.contents)
	$effect(() => {
		if (ctx.user.key && !users.has(ctx.user.key)) {
			console.log('trigger trigger, pull my finger')
			pool.exec(async (db) =>
				record_user(db, {
					name: ctx.user.name,
					key: ctx.user.key
				})
			)
		}
		if (!contents) return
		console.log(contents)
		switch (data.service) {
			case 'arena':
				pool.exec(async (tx) => persistChannels(tx, data.user, contents))

				break
			case 'atproto':
				console.log('shoulda used tap')
				pool.exec(async (tx) => {
					return Promise.all(
						[
							persistCosmikEntries(tx, contents.collections),
							persistCosmikEntries(tx, contents.cards),
							persistCosmikConnections(tx, contents.connections)
						].flat()
					)
						.then(console.debug)
						.catch((err) => {
							console.error(err)
							error = err
						})
						.finally(() => ev_stmt_close(tx))
				})
				break
			case 'raindrop':
				break
		}
	})

	const scroll = (init = 0) => {
		let val = $state(init)
		return {
			get val() {
				return val
			},
			set val(v) {
				val = v
			}
		}
	}
	let y = scroll(0)
	export const snapshot: Snapshot<number> = {
		capture() {
			return y.val
		},
		restore(value) {
			y.val = value
		}
	}
</script>

<svelte:head>
	<title>{ctx.user?.name} | vfdir</title>
</svelte:head>

{#if !user}
	<div class="error">
		{error}
		User: {ctx.user?.key} not found. Try searching one of their channels instead.
		{#if ctx.service === 'atproto'}
			Are you sure this did is correct? <a
				href="https://pdsls.dev/at://{ctx.user.key}#collections:network.cosmik"
				>Check on pdsls.dev</a
			>
		{:else}
			If this is an are.na user, try searching one of their channels instead.
		{/if}
	</div>
{:else if user.entries?.length === 0}
	empty
{:else}
	<View data={user.entries} {y} />
{/if}

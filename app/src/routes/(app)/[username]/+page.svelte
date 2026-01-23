<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { page } from '$app/state'
	import View from '$lib/components/view.svelte'
	import { Block } from '$lib/data/block.svelte.js'
	import { Channel } from '$lib/data/channel.svelte.js'
	import { users } from '$lib/data/maps.svelte'
	import { pullCosmik } from '$lib/services/atpro/pullCosmik'
	import type { Snapshot } from '@sveltejs/kit'
	import { untrack } from 'svelte'

	const { data } = $props()
	$inspect(data)
	const username = $derived(
		data.service === 'atproto' ? data.actor.did : page.params.username!
	)

	$effect(() => {
		if (!data.contents) return
		data.contents.data
		untrack(() => {
			data.contents.data.forEach((e) => {
				if (e.base_type === 'Block') {
					new Block(Block.fromArena(e))
					return
				}
				if (e.base_type === 'Channel') {
					new Channel(Channel.fromArena(e))
				}
			})
		})
	})

	const user = $derived(users.get(username))
	$inspect(user)

	// const user = $derived(users.get(page.params.username))
	// const data = $derived(user?.entries)
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

	$effect(() => {
		if (data.service === 'atproto')
			untrack(() => {
				pullCosmik(data.actor)
			})
	})
</script>

<svelte:head>
	<title>{data.actor?.handle ?? username} | vfdir</title>
</svelte:head>

{#if !user}
	<div class="error">
		User: {username} not found. Try searching one of their channels instead.
		{#if data.service === 'atproto'}
			Are you sure this did is correct? <a
				href="https://pdsls.dev/at://{username}#collections:network.cosmik"
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

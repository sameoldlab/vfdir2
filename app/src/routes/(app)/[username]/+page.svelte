<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { page } from '$app/state'
	import View from '$lib/components/view.svelte'
	import { api } from '$lib/convex/_generated/api'
	// import { users } from '$lib/data/maps.svelte'
	import { spiderUser } from '$lib/queries/listRecords.remote'
	import { isActorIdentifier } from '@atcute/lexicons/syntax'
	import type { Snapshot } from '@sveltejs/kit'
	import { useQuery } from 'convex-svelte'
	import { ConvexError } from 'convex/values'
	import { untrack } from 'svelte'

	const { data } = $props()
	const { username } = $derived(page.params)

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
	const cvx_entries = useQuery(api.data.get_user_entries, {
		/* pagination: {
			numItems: 0,
			cursor: null
		}, */
		userId: page.params?.username ?? ''
	})
	$effect(() => {
		if (data.actor)
			untrack(() => {
				spiderUser({ did: data.actor.did, pds: data.actor.pds })
			})
	})
</script>

<svelte:head>
	<title>{data.actor?.handle ?? username} | vfdir</title>
</svelte:head>
{#if cvx_entries.isLoading}
	loading...
{:else if cvx_entries.error}
	<div class="error">
		{#if (cvx_entries.error as ConvexError<{ message: string; code: number }>).data.message === 'user not found'}
			Could not find user: <code>{username}</code>.<br />
			{#if username && isActorIdentifier(username)}
				Are you sure this did is correct? <a
					href="https://pdsls.dev/at://{username}#collections:network.cosmik"
					>Check on pdsls.dev</a
				>
			{:else}
				If this is an are.na user, try searching one of their channels instead.
			{/if}
		{:else}
			{cvx_entries.error}
		{/if}
	</div>
{:else if cvx_entries.data}
	<View data={cvx_entries.data} {y} />
{/if}

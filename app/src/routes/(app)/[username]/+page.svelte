<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { page } from '$app/state'
	import View from '$lib/components/view.svelte'
	import { api } from '$lib/convex/_generated/api'
	// import { users } from '$lib/data/maps.svelte'
	import { spiderUser } from '$lib/queries/listRecords.remote'
	import type { Snapshot } from '@sveltejs/kit'
	import { useQuery } from 'convex-svelte'
	import { ConvexError } from 'convex/values'

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
	const { username } = $derived(page.params)
	$effect(() => {
		if (
			username &&
			((username.startsWith('did:') && username.split(':')?.length === 3) ||
				username.includes('.'))
		)
			spiderUser({ did: username })
	})
</script>

{#if cvx_entries.isLoading}
	...loading
{:else if cvx_entries.error}
	<div class="error">
		{#if (cvx_entries.error as ConvexError<{ message: string; code: number }>).data.message === 'user not found'}
			Could not find user: <code>{page.params.username}</code>.<br />
			If this is an are.na user, try searching one of their channels instead.
		{:else}
			{cvx_entries.error}
		{/if}
	</div>
{:else if cvx_entries.data}
	<View data={cvx_entries.data} {y} />
{/if}

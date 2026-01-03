<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { onMount } from 'svelte'
	import { ulid } from 'ulidx'
	import { getSession } from '$lib/utils/session'
	import { useConvexClient } from 'convex-svelte'
	import { api } from '$lib/convex/_generated/api'
	let { children } = $props()

	const client = useConvexClient()
	let session = getSession()
	let ready = $state(false)

	async function init() {
		let localkey = localStorage.getItem('vfdir_sessionKey')
		if (!localkey) {
			localkey = 'ldev_' + ulid()
			console.error('session creation starting')
			const result = await client.mutation(api.oauth.createSession, {
				key: localkey
			})
			if (!result) {
				console.error('session creation failed')
				return
			}
			console.log('session successful')
			session.v = localkey
			localStorage.setItem('vfdir_sessionKey', session.v)
		} else {
			console.error('session creation starting')
			const result = await client.mutation(api.oauth.createSession, {
				key: localkey
			})
			if (!result) {
				console.error('session creation failed')
				return
			}
			console.log('session successful')
			session.v = localkey
		}
	}
	onMount(() => {
		init().finally(() => {
			ready = true
		})
	})
</script>

{#if ready}
	{@render children()}
{/if}

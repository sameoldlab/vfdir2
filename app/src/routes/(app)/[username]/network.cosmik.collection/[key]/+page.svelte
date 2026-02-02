<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { page } from '$app/state'
	import View from '$lib/components/view.svelte'
	import { channels } from '$lib/data/maps.svelte'
	import type { Snapshot } from '@sveltejs/kit'


	const key = $derived(`${page.params.username}/network.cosmik.collection/${page.params.key}`)
	const channel = $derived(channels.get(key))

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
	$inspect(channel?.entries)
</script>

{#if !channel}
	<div class="error">Channel not cached. Fetching...</div>
{:else if channel.entries.length === 0}
	<div class="error">
		<p>Channel is empty.</p>
		<br />
		Searching arena for a matching channel...
		<p>
			or... make one of your o-- <span class="text-4"
				>sorry! haven't built this part yet</span
			>
		</p>
	</div>
{:else}
	<View data={channel.entries} {y} />
{/if}

<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import View from '$lib/components/view.svelte'
	import { entries } from '$lib/data/maps.svelte'
	import { subscribeMrks } from '$lib/services/atproto/client'
	import type { Snapshot } from '@sveltejs/kit'

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
	let dir = $state('/home/ibro/Documents/ref/oooooooooooooooohh')
	let files: { name: string; path: string }[] = []
	// let subs = $state([])
</script>

<input type="text" bind:value={dir} />
<View data={files} {y} />
<button
	onclick={async () => {
		const subs = subscribeMrks(['did:plc:ukgwapa3bceculh4cobcopg3'])
		for await (const ev of subs) {
			console.log(ev)
		}
	}}>Connect Stream</button
>
<!-- Firefox can’t establish a connection to the server at wss://jetstream2.us-east.bsk.network/subscribe?requireHello=true&cursor=1766851302286000. -->

<!-- {#each subs as sub} -->

<!-- {/each} -->

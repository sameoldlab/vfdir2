<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import View from '$lib/components/view.svelte'
	import { entries } from '$lib/data/maps.svelte'
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
</script>

<div class="error">
	placeholder for authenticated account private dashboard. Try going to your
	atprocol profile (vfdir.same.supply/cool-site.me)
</div>
<View data={[]} {y} />

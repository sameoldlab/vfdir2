<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import View from '$lib/components/view.svelte'
	import { entries } from '$lib/data/maps.svelte'
	import type { Snapshot } from '@sveltejs/kit'
	import { convertFileSrc, invoke } from '@tauri-apps/api/core'
	import { readTextFile } from '@tauri-apps/plugin-fs'

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
	let files: { name: string; path: string }[] = $derived(
		await invoke('get_directory', { dir })
	)
</script>

<input type="text" bind:value={dir} />
<svelte:boundary>
	{#snippet pending()}
		waiting...
	{/snippet}
	<View
		data={files
			.filter((f) => !f.path.endsWith('.zip'))
			.map((f) => ({
				key: f.path,
				id: f.path,
				title: f.name,
				content: readTextFile(f.path),
				type:
					f.path.endsWith('png') || f.path.endsWith('gif')
						? 'media'
						: f.path.endsWith('md') ||
							  f.path.endsWith('txt') ||
							  f.path.endsWith('webloc')
							? 'text'
							: 'channel',
				filename: f.name,
				provider_url: 'fs',
				source: 'fs',
				image:
					f.path.endsWith('png') || f.path.endsWith('gif')
						? convertFileSrc(f.path)
						: null,
				author: {
					key: 'fs',
					id: 'fs',
					name: 'fs'
				}
			}))}
		}
		{y}
	/>
	<!--<div style="display: flex; flex-wrap: wrap; align-items: start;">
		{#each files as file}
			{#if file.path.endsWith("png")}
				<img src={convertFileSrc(file.path)} />
			{:else if file.path.endsWith("md") || file.path.endsWith("txt") || file.path.endsWith("webloc")}
				{#await readTextFile(file.path) then string}
					{string}
				{/await}
			{:else}
			<button onclick={() =>{
					dir = file.path
				}}>{file?.name}</button>
			{/if}
		{/each}
</div>
-->
</svelte:boundary>

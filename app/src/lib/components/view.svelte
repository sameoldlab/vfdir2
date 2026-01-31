<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import GridView from './views/GridView.svelte'
	import MillerView from './views/MillerView.svelte'
	import type { Block, Channel } from '$lib/data/types'
	import { pageview } from '$lib/utils/pageView.svelte'
	import { tick } from 'svelte'

	let {
		data,
		y = $bindable()
	}: { data: (Block | Channel)[]; y: { val: number } } = $props()

	let main: HTMLDivElement
	const onscroll = (e) => (y.val = (e.target as HTMLDivElement).scrollTop)
	$effect(() => {
		tick().then(() => main.scrollTo({ top: y.val }))
	})
</script>

<div {onscroll} bind:this={main}>
	{#if pageview.v === 'table'}
		todo
	{:else if pageview.v === 'canvas'}
		todo
	{:else if pageview.v === 'miller'}
		<MillerView {data} />
	{:else}
		<GridView {...data} />
	{/if}
</div>

<style>
	div {
		height: 100%;
		overflow: auto;
	}
</style>

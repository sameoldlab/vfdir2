<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import './blockType.css'
	// import { handleFile } from '$lib/utils/getFile'
	import { micromark } from 'micromark'
	import { blur } from 'svelte/transition'
	import type { Entry } from '$lib/data/types'
	import { naturalDate } from '$lib/utils/naturalDate'

	let { ...c }: Entry = $props()
	const connect = (e: MouseEvent) => {
		e.preventDefault()
		console.log(c)
	}
	const makeLink = () => {
		let link = 'https://'
		switch (c.source) {
			case 'arena':
				link += `are.na/${c.author.key}/${c.key}`
				break
		}
		return link
	}
	const source = !c.source ? null : c.type !== 'channel' ? c.source : makeLink()
	let content = $state("")
	 // c.type === 'text' ? micromark() : null
	c.content?.then(c => {
		content = micromark(c)
	})
	const imgLoad = (e: Event) => {
		const el = e.target as HTMLImageElement
		el.classList.add('loaded')
	}
	const genRoute = () => {
		if (c.type !== 'channel') return  `/block/${c.key}`
		if (c.key.includes(c.author.key)) return c.key
		return `/${c.author.key}/${c.key}`
	}
</script>

<div class="block-item {status}" id={c.key}>
	<div class="box">
		<a
			class={c.type}
			href={genRoute()}
		>
			{#if c.image}
				<img
					in:blur
					onload={imgLoad}
					src={c.image}
					alt={c.image}
					class="waiting"
				/>
			{:else if c.type === 'attachment'}
				<video
					src={c.attachment}
					autoplay
					loop
					muted
				></video>
			{:else if c.type === 'channel'}
				<div class="channel">
					<p class="title">{c.title} [{c.entries.length}]</p>
					<p class="author">by {c.author.name}</p>
					<p> {naturalDate(c.updated_at)}</p>
				</div>
			{:else if content}
				<div class="text"><p>{@html content}</p></div>
			{/if}
		</a>
		<div class="overlay">
			<div class="start">
				<div class="start">**</div>
				<button class="end">...</button>
			</div>
			<div class="end">
				{#if source}
					<a href={source} class="btn">Source</a>
				{/if}
				<button onclick={connect} class="btn">Connect</button>
			</div>
		</div>
	</div>
	<p class="title">{c.title || '-'}</p>
</div>

<style>
	:global(img) {
		transition-property: opacity, filter;
		transition-duration: 120ms;
		transition-timing-function: ease-out;

		&.waiting {
			opacity: 0;
			filter: blur(16px);
		}
		&.loaded {
			opacity: 1;
			filter: none;
		}
	}
	.text > p {
		height: 100%;
		padding: 1ch;
		max-width: 100%;
		line-break: strict;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		text-overflow: clip;
	}

	.channel {
		.title {
			font-size: 1.5rem;
		}
		div {
			color: var(--type);
			display: flex;
			flex-direction: column;
			text-align: center;
			justify-content: center;
		}
	}
</style>

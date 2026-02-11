<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { naturalDate } from '$lib/utils/naturalDate'
	import { handleFile } from '$lib/utils/getFile'
	import { fade } from 'svelte/transition'
	import { micromark } from 'micromark'
	import type { Entry } from '$lib/data/types'

	let { block: b }: { block: Entry } = $props()

	const content = $derived(
		b.type === 'text'
			? micromark(b.content ?? '')
			: b.type === 'link' && b.image === ''
				? `<p>${b.description}</p>`
				: null
	)
	const genRoute = (e: Entry) => {
		if (e.key.includes('/')) return `/${e.key}`
		return `/${e.author.key}/${e.key}`
	}
</script>

<div class="wrapper">
	<article>
		<div class="block">
			{#if b.image}
				{#key b.image}
						<!-- use:handleFile={{ src: b.image, pool: getPool() }} -->
						<!-- data-src={b.image} -->
					<img
						src={b.image}
						in:fade
						crossorigin="anonymous"
						alt={b.image}
					/>
				{/key}
			{:else if b.type === 'attachment'}
					<!-- use:handleFile={{ src: b.attachment! }}
					data-src={b.attachment} -->
				<video
					src={b.attachment}
					muted
					autoplay
					loop
					controls
				></video>
			{:else if b.type === 'channel'}
				<div class="channel">
					<p class="wrapper">{b.title}</p>
					<p class="author">by {b.author?.name}</p>
				</div>
				src={b.image}
			{:else if content}
				<div class="text"><p>{@html content}</p></div>
			{/if}
		</div>
		<aside>
			<header>
				<h1>{b.title}</h1>
				<p class="description text-6">{b.description}</p>
			</header>
			<div class="data">
				<p class="label">Type</p>
				<p>{b.type}</p>
				<p class="label">By</p>
				<a href={'/' + b.author.key}> {b.author.name} </a>

				{#if 'source' in b && b.source}
					<p class="label">Source</p>
					<a href={b.source}> {b.title} </a>
				{/if}
				<p class="label">Added</p>
				<time datetime={new Date(b.created_at).toLocaleString()}
					>{naturalDate(b.created_at)}</time
				>
				<p class="label">Modified</p>
				<time datetime={new Date(b.updated_at).toLocaleString()}
					>{naturalDate(b.updated_at)}</time
				>
				<p class="label">Connections</p>
				<div class="connections">
					{#each b.connections as channel}
						<a href={`${genRoute(channel)}#${b.key}`} class="connection">
							<span
								>{channel.title} [{channel.length}] by {channel.author
									?.name}</span
							>
							<p></p>
						</a>
					{/each}
				</div>
			</div>
		</aside>
	</article>
</div>

<style>
	div.wrapper {
		container-name: wrapper;
		container-type: inline-size;
		width: 100%;
		height: 100%;
		overflow-y: auto;
		padding: 1em 1em 2em;
	}
	article {
		display: flex;
		width: 100%;
		flex-direction: column;
		margin-inline: auto;
		gap: 1em;
	}
	@container wrapper (width > 800px) {
		article {
			flex-direction: row;
		}
	}
	div.block {
		display: flex;
		gap: 1em;
		flex-wrap: wrap;
		overflow-x: auto;
		justify-content: space-evenly;
		align-items: center;
		display: flex;
		justify-content: center;
		padding-block: 1rem;
	}
	img,
	video {
		width: 1rem;
		width: clamp(5rem, 50cqi, 700px);
	}
	aside {
		max-width: min(60ch, 100%);
	}
	h1 {
		font-size: 1rem;
		padding-block-start: 0.75em;
		padding-block-end: 0.25em;
	}
	header {
		padding-block: 1rem 2rem;
	}
	.data {
		display: grid;
		grid-template-columns: min-content 1fr;
		column-gap: 1rem;
		background-color: var(--b1);
		padding: 1rem 0.5rem;
	}
	.metadata {
		margin-inline-start: auto;
		margin-inline: auto;
		width: 100%;
		padding-inline-end: 1rem;
		display: grid;
		gap: 0.25rem;
	}
	.label {
		text-align: end;
		color: var(--b4);
		font-weight: 500;
		font-size: 0.95rem;
	}
	.connections {
		display: grid;
		gap: 0.75rem;
	}
	.connection {
		display: flex;
		justify-content: space-between;
		/* padding-block: 0.5rem; */
		/* border-block: 1px solid var(--line); */
	}
</style>

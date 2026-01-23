<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import type { Snippet } from 'svelte'

	let { id, children, beforetoggle }: { id: string; children: Snippet, beforetoggle: (e: ToggleEvent) => void } = $props()
</script>

<div {id} popover="auto" onbeforetoggle={beforetoggle}>
	<!-- <button popovertarget={id} popovertargetaction="hide">✖</button> -->
	{@render children()}
</div>

<style>
	div {
		width: auto;
		border-radius: 0;
		overflow-y: hidden;
		border: 0px solid var(--line);
		top: 50%;
		left: 50%;
		translate: -50% -50%;
		background: var(--b2);
		padding: 1rem;
		&::backdrop {
			backdrop-filter: blur(1px);
		}
	}
	button {
		background: none;
		
		position: fixed;
		padding: .5rem;
		top: 1rem;
		right: 1rem;
	}
</style>

<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { enhance } from '$app/forms'
	import Modal from './modal.svelte'
	let { id = $bindable('addChannel') }: { id: string } = $props()
	const sanititize = (string = '') =>
		string
			.trim()
			.replaceAll(/ |\/|\\|\&|\%|\#|:/g, '-')
			.toLowerCase()

	let title = $state('')
	const slug = $derived({ collision: false, string: sanititize(title) })
	let description = $state('')
	let service = $state('cosmik')
	const submit = (e: MouseEvent) => {
		e.preventDefault()
	}
</script>

<Modal beforetoggle={(e)=>{
	console.log(e)
		if (e.newState === 'closed') {
			title = ''
			description = ''
		}
	}} {id}>
	<form method='POST' use:enhance>
		<div>
			<label hidden for="channel-title">Title </label>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				autofocus
				bind:value={title}
				id="channel-title"
				type="text"
				required
				placeholder="Title"
			/>
			<!-- <p class="text-5">slug: <code>{slug.string}</code></p> -->
		</div>
		<div>
			<label class="text-5" for="channel-description">Description</label>
			<textarea
				bind:value={description}
				id="chanel-description"
				placeholder="channel description"
			></textarea>
		</div>
		<div>
			<label class="text-5" for="channel-service">Backing Service</label>
			<select bind:value={service} id="channel-service">
				<option value="cosmik" selected>cosmik</option>
				<option value="arena">are.na</option>
				<option value="raindrop" disabled>raindrop</option>
				<option value="local" disabled>none (local)</option>
			</select>
		</div>

		<div class="submit">
			<button
				class="btn"
				type="button"
				popovertarget={id}
				popovertargetaction="hide">esc</button
			>
			<button class="btn" onclick={submit}>create channel</button>
		</div>
	</form>
</Modal>

<style>
	#channel-title {
		font-size: 2rem;
		font-weight: 600;
	}
	.submit {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1rem;
		justify-content: stretch;
	}
	button {
		background: var(--b3);
		&:hover, &:focus {
			background: var(--b4);
		}
	}
	form {
		div {
			display: flex;
			flex-direction: column;
			padding-block: 0.5rem;
		}
	}
	label {
		opacity: 0.6;
		padding-block-end: 0.25rem;
	}
	input,
	select,
	textarea {
		color-scheme: dark;
		background: none;
		border: 0;
		padding: .125rem;
	}
	option {
		color-scheme: dark;
	}
	input {
		border: 1px solid var(--b2);
		&:focus {
			border-bottom-color: var(--b5);
			outline: none;
		}
	}
	textarea {
		height: 4.5rem;
		padding: 0.5rem;
		&::placeholder {
			color: var(--b6);
		}
		&:focus {
			background: var(--b3);
			outline: none;
		}
	}
	hidden {
		opacity: 0;
		height: 0;
	}
</style>

<script>
	import { enhance } from '$app/forms'
	import ArenaIcon from '$lib/components/svg/arena.svelte'
	import RaindropIcon from '$lib/components/svg/raindrop.svelte'
	const params = [
		{
			label: 'are.na',
			service: 'arena',
			icon: ArenaIcon
		},
		{
			label: 'raindrop',
			service: 'raindrop',
			icon: RaindropIcon
		}
	]
</script>

<form method="POST" use:enhance>
	<div class="form">
		<p class="text-7">Jack in your mortal coil(s)</p>
		<div class="row full">
			{#each params as { label, service, icon: Icon } (label)}
				<button
					formaction="/oauth/{service}"
					disabled={service != 'arena'}
					class="btn"
				>
					<Icon />
					<span>{label}</span></button
				>
			{/each}
		</div>
		<div class="row">
			<hr />
			or
			<hr />
		</div>
		<label for="atproto-connect">
			<div class="row">
				<span class="text-5"
					><span class="text-4">@</span>proto did / pds url</span
				>
				<div class="text-4">
					<a class="info" href="https://atproto.dev">?</a>
				</div>
			</div>
			<input type="text" name="atproto-connect" placeholder="cool-site.me" />
		</label>
		<button class="btn text-4" type="submit">continue.</button>
	</div>
</form>

<style>
	.form {
		padding-block: 3rem;
		width: min(50ch, 100%);
		margin-inline: auto;
	}
	.form,
	form {
		display: grid;
		gap: 1rem;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.5rem;

		hr {
			opacity: 0.3;
			flex-grow: 2;
		}
	}
	.btn {
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	:global(.form .btn > svg) {
		height: 100%;
		width: auto;
	}
	label {
		display: grid;
		gap: 0.25rem;
		span {
			font-weight: 500;
		}
	}
	input {
		background: transparent;
		color: var(--b5);
		border: 1px solid oklch(from var(--line) l c h / 0.7);
		padding: 0.5rem 1rem;
	}
	.info {
		border: 1px solid var(--line);
		border-radius: 3rem;
		display: flex;
		aspect-ratio: 1 /1;
		height: 1.25rem;
		width: auto;
		align-items: center;
		text-align: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
	}
	.full {
		& > * {
			flex-grow: 1;
		}
	}
	button:disabled {
		opacity: .3;
		cursor: not-allowed;
	}
</style>

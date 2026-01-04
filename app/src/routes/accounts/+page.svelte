<script>
	import { enhance } from '$app/forms'
	import ArenaIcon from '$lib/components/svg/arena.svelte'
	import RaindropIcon from '$lib/components/svg/raindrop.svelte'
	import { api } from '$lib/convex/_generated/api'
	import { getSession } from '$lib/utils/session'
	import { useQuery } from 'convex-svelte'

	const sessionKey = getSession()
	const connections = useQuery(api.oauth.getAllServices, {
		sessionId: sessionKey.v
	})
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

<div class="form">
	<p class="text-7">Jack in your mortal coil(s)</p>
	{#each params as { label, service, icon: Icon } (label)}
		{@const cap = connections.data?.find((v) => v.service === service)}
		{#if cap}
			<div class="row">
				<Icon />
				{label}
				| {cap.displayName}
				<div class="spacer"></div>
				<a href="/oauth/{service}/?revoke">disconnect</a>
			</div>
		{:else}
			<a
				type="button"
				href="/oauth/{service}?/connect"
				class="btn"
			>
				<Icon />
				<span>{label}</span>
			</a>
		{/if}
	{/each}
	<div class="row">
		<hr />
		or
		<hr />
	</div>
	<form method="POST" action="/oauth/atproto?/connect" use:enhance>
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
	</form>
	<button class="btn text-4" formaction="/oauth/atproto?/connect" type="submit"
		>continue.</button
	>
</div>

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
		background: var(--b2);
		color: var(--b7);
		font-weight: 500;
		border: 1px solid oklch(from var(--line) l c h / 0.5);
		padding: 0.5rem 1rem;
		&:active, &:selected, &:focus {
			border: 1px solid oklch(from var(--b7) l c h / 1);
			outline: none;
		}
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
		opacity: 0.3;
		cursor: not-allowed;
	}
	.connected {
		background: oklch(from var(--b3) l calc(c + 0.07) 120);
		opacity: 0.3;
	}
	.spacer {
		flex-grow: 1;
	}
	.btn {
		cursor: pointer;
		&:hover {
			background-color: var(--b3);
		}
	}
</style>

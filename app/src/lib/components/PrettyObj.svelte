<script lang="ts">
	const { data } = $props()
	import Self from './PrettyObj.svelte'

	const isObject = (v: unknown) =>
		v !== null && typeof v === 'object' && !Array.isArray(v)
	const isString = (v: unknown) => typeof v === 'string'

	const getValueColor = (v: unknown) => {
		if (typeof v === 'string') return '#8be9fd'
		if (typeof v === 'number') return '#bd93f9'
		if (typeof v === 'boolean') return '#ff79c6'
		return '#f8f8f2'
	}
</script>

<div class="object-display">
	{#each Object.entries(data) as [key, value]}
		<div class="line">
			<span class="key">{key}:</span>
			{#if isObject(value)}
				<Self data={value} />
			{:else if isString(value)}
				<span class="value string">"{value}"</span>
			{:else}
				<span class="value" style="color: {getValueColor(value)}">{value}</span>
			{/if}
		</div>
	{/each}
</div>

<style>
	.object-display {
		font-family: monospace;
		font-size: 0.85rem;
		color: #f8f8f2;
		padding: 0.25rem;
	}

	.line {
		border-inline-start: 1px solid var(--b3);
		padding: 0 0.75rem;
	}

	.key {
		color: oklch(from var(--b5) l 0.01 122);
	}

	.value {
		margin-left: 4px;
		&.string {
			color: oklch(from var(--b5) l 0.05 290);
		}
	}
</style>

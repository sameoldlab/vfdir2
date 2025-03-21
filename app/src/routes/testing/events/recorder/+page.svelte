<!-- SPDX-License-Identifier: MPL-2.0 -->

<script lang="ts">
	import { pool } from '$lib/database/connectionPool.svelte'

	const channel = new BroadcastChannel('updates')
	const eventData = $state<object[]>([])
	// const headers: string[] = $derived(Object.keys(eventData[0] || {}))
	const headers = ['rowid', 'type', 'objectId', 'originId', 'localId', 'data']
	$inspect(eventData)
	$inspect(headers)

	$effect(() => {
		pool.exec(async (tx) => {
			const events = await tx.execO('select rowid, * from log')
			eventData.push(...events)
		})
	})
	let query = $state('')
	const filtered = $derived(
		eventData.filter((row) =>
			Object.entries(row).some(
				([key, value]) =>
					key !== 'data' &&
					String(value).toLowerCase().includes(query.toLowerCase())
			)
		)
	)

	channel.addEventListener('message', (ev) => {
		if (ev.data) {
			const ub = [...ev.data.values()]
			pool.exec(async (tx, db) => {
				await db
					.execO('select rowid, * from log where rowid between ? and ?', [
						ub[0],
						ub.at(-1)
					])
					.then((events) => {
						eventData.push(...events)
					})
			})
		}
	})
</script>

<div>
	<input type="text" bind:value={query} />
</div>
<main>
	<!-- Table wrapper with sticky header -->
	<div id="wrapper">
		<table>
			<!-- Sticky header -->
			<thead>
				<tr>
					{#each headers as header}
						<th class="px-6 py-3">{header}</th>
					{/each}
				</tr>
			</thead>
			<!-- Scrollable body -->
			<tbody class="divide-y divide-gray-200">
				{#each filtered as row}
					<tr class="bg-white hover:bg-gray-50">
						{#each headers as header}
							<td class="px-6 py-4"
								><div>
									{row[header]}
								</div>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</main>

<style>
	main {
		/* w-full rounded-lg border border-gray-200 shadow-sm */
		width: 100%;
		overflow: auto;
		height: 100%;
	}
	#wrapper {
		position: relative;
		max-height: 500px;
	}
	table {
		width: 100%;
		font-size: small;
	}
	thead {
		font-size: x-small;
		position: sticky;
		top: 0;
		text-align: left;
		background: var(--b2);
		tr {
			padding: 0.25rem;
			border-block-end: var(--border);
		}
	}
	td {
		max-height: 3rem;
	}
	td > div {
		max-height: 3rem;
		max-width: 20ch;
		scrollbar-width: none;
		display: flex;
		justify-content: start;
		align-items: start;
		overflow: scroll;
	}
</style>

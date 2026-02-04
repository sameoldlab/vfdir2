<main>
	<div class="fails">
		<p class="text-5">Vagrant diagnoses give you more by joining fragments</p>
		<p class="text-4">
			Vivid directions to your friendly referverse- audience groans
		</p>
		<p class="text-3">One ring to bring them and in- no torment nexus</p>
		<p class="text-2">
			Give me your wired, your pored, your muddled messy thoughts<br />
			<span class="text-1"
				>yearning to breed meaning, the wretched-waaay too much</span
			>
		</p>
	</div>
	<div class="pitch">
		<h1 class="text-7">Valiant future declarations</h1>
		<p class="text-6">
			Volatile File Directory is a {'{bookmarking/referencing/collecting}'}
			<span class="crossout text-4">site</span>
			application without a service. Viscerally Flavoured Data pulls in content you've
			saved on open parts of the web and lets you view them all in one place. Progress
			is still early but
			<a
				href="https://same.supply?ref=vfdir"
				target="_blank"
				class="text-7">my</a
			>
			plans are to focus on performance and new types of interactions. You are currently
			using a canary* web version
			<span class="redact text-4"
				>vauge allusions towards a native desktop alternative</span
			> with much more on the way.
		</p>
		<p>Have fun discovering and valuable linking</p>
		<a class="text-7" href="/">begin.</a>
	</div>
</main>

<style>
	*::selection {
		background: red;
		color:black;
		text-shadow: none;
	}
	.crossout {
		text-decoration: line-through;
	}
	main {
		font-family: Newsreader, Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
		padding: 8rem 2rem;
		max-width: 60ch;
		margin-inline: auto;
		display: grid;
		gap: 1.5rem;
	}
	h1 {
		font-size: 1.125rem;
		line-height: 2rem;
		font-weight: 500;
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			Oxygen,
			Ubuntu,
			Cantarell,
			'Open Sans',
			'Helvetica Neue',
			sans-serif;
	}
	.fails {
		text-align: center;
	}
	@keyframes unblur {
		0% {
			filter: blur(50px);
			opacity: 0;
		}
		50% {
			opacity: .7;
		}
		100% {
			opacity: 1;
			filter: blur(0);
		}
	}
	.fails, .pitch {
		opacity: 0;
		animation: unblur 1.2s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
	}
	/* .pitch {
		animation: unblur 400ms cubic-bezier(0.165, 0.84, 0.44, 1) both;
	} */
	.pitch p {
		padding-bottom: 1rem;
		line-height: 1.5rem;
	}
	.redact {
		background-color: var(--b4);
	}
	a {
		font-style: italic;
	}

</style>

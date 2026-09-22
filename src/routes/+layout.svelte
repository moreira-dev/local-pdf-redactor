<script lang="ts">
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.min.css';
	import '$lib/styles/theme.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="container pt-4 pb-5">
	<div class="col-lg-8 mx-auto">
		<a class="logo d-inline-block border px-2 py-1 fw-bold text-decoration-none" href="/">
			Local PDF Redactor
		</a>
	</div>
</header>

<main>
	{@render children()}
</main>

<footer class="inverted py-5">
	<div class="container">
		<div class="col-lg-8 mx-auto">
			<a class="logo d-inline-block border px-2 py-1 fw-bold text-decoration-none" href="/">
				Local PDF Redactor
			</a>
			<p class="mt-3 mb-0 small">&copy; 2026 Local PDF Redactor - Moreira.dev</p>
		</div>
	</div>
</footer>

<style>
	.logo {
		background-color: var(--color-accent);
		color: var(--color-text);
	}
</style>

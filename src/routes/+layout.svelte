<script lang="ts">
	import 'bootstrap/dist/css/bootstrap.min.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="border-bottom">
	<div class="container py-3">
		<a class="fs-4 fw-semibold link-body-emphasis text-decoration-none" href="/">Local PDF Redactor</a>
	</div>
</header>

<main class="container py-5">
	{@render children()}
</main>

<footer class="border-top">
	<div class="container py-4 small text-body-secondary">Local PDF Redactor</div>
</footer>

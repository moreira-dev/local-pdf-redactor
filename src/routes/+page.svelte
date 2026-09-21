<script lang="ts">
	import PagePreview from '$lib/components/pdf/PagePreview.svelte';
	import { DocumentState } from '$lib/state/document.svelte';

	const doc = new DocumentState();

	let fileInput: HTMLInputElement;
	let isDragging = $state(false);

	function selectFromInput(event: Event) {
		const input = event.currentTarget;

		if (!(input instanceof HTMLInputElement)) {
			return;
		}

		doc.select(input.files?.[0]);
		input.value = '';
	}

	function selectFromDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		doc.select(event.dataTransfer?.files[0]);
	}
</script>

<svelte:head>
	<title>Local PDF Redactor</title>
</svelte:head>

<section>
	<h1 class="h2 mb-4 text-center">Choose a PDF to redact</h1>

	<input bind:this={fileInput} class="visually-hidden" type="file" accept="application/pdf" onchange={selectFromInput} />

	<button
		class:bg-primary-subtle={isDragging}
		class:border-primary={isDragging}
		class="w-100 rounded-3 border border-2 border-secondary-subtle p-5 text-center"
		type="button"
		onclick={() => fileInput.click()}
		ondragover={(event) => {
			event.preventDefault();
			isDragging = true;
		}}
		ondragleave={() => (isDragging = false)}
		ondrop={selectFromDrop}
	>
		<span class="d-block fs-4 fw-semibold">Drop a PDF here</span>
		<span class="d-block mt-2 text-body-secondary">or choose a file from your device</span>
	</button>

	{#if doc.file}
		<p class="mt-3 mb-0 text-center" aria-live="polite">
			Selected: {doc.file.name}
			{#if doc.pages.length > 0}
				<span class="text-body-secondary">
					({doc.pages.length}
					{doc.pages.length === 1 ? 'page' : 'pages'})
				</span>
			{/if}
		</p>
		{#if doc.pages.length > 0}
			<p class="mt-1 mb-0 text-center">
				Found {doc.detections.length}
				{doc.detections.length === 1 ? 'item' : 'items'} with personal information
			</p>
		{/if}
	{/if}

	{#if doc.error}
		<p class="alert alert-danger mt-3 mb-0" role="alert">{doc.error}</p>
	{/if}

	{#if doc.pages.length > 0}
		<div class="mt-4">
			{#each doc.pages as page (page.pageNumber)}
				<PagePreview {page} detections={doc.detections.filter((detection) => detection.pageNumber === page.pageNumber)} />
			{/each}
		</div>
	{/if}
</section>

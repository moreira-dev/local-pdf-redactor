<script lang="ts">
	import { selectDocumentFile, selectedDocument } from '$lib/document.svelte';

	let fileInput: HTMLInputElement;
	let isDragging = $state(false);

	function selectFromInput(event: Event) {
		const input = event.currentTarget;

		if (!(input instanceof HTMLInputElement)) {
			return;
		}

		selectDocumentFile(input.files?.[0]);
		input.value = '';
	}

	function selectFromDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		selectDocumentFile(event.dataTransfer?.files[0]);
	}
</script>

<svelte:head>
	<title>Local PDF Redactor</title>
</svelte:head>

<section>
	<h1 class="h2 mb-4 text-center">Choose a PDF to redact</h1>

	<input
		bind:this={fileInput}
		class="visually-hidden"
		type="file"
		accept="application/pdf"
		onchange={selectFromInput}
	/>

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

	{#if selectedDocument.file}
		<p class="mt-3 mb-0 text-center" aria-live="polite">Selected: {selectedDocument.file.name}</p>
	{/if}

	{#if selectedDocument.error}
		<p class="alert alert-danger mt-3 mb-0" role="alert">{selectedDocument.error}</p>
	{/if}
</section>

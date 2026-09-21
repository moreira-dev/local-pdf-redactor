<script lang="ts">
	import PagePreview from '$lib/components/pdf/PagePreview.svelte';
	import { DocumentState } from '$lib/state/document.svelte';

	const documentState = new DocumentState();

	let fileInput: HTMLInputElement;
	let isDragging = $state(false);
	let isRedacting = $state(false);

	function handleFileSelected(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const selectedFile = input.files?.[0];
		if (selectedFile) {
			documentState.select(input.files?.[0]);
		}
		input.value = '';
	}

	function handleFileDropped(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		const droppedFile = event.dataTransfer?.files[0];

		if (droppedFile) {
			documentState.select(event.dataTransfer?.files[0]);
		}
	}

	function createRedactedFileName(fileName: string): string {
		if (fileName.toLowerCase().endsWith('.pdf')) {
			fileName = fileName.slice(0, -4);
		}

		return `${fileName}-redacted.pdf`;
	}

	function downloadFile(bytes: Uint8Array, fileName: string) {
		// As suggested in https://libpdf.documenso.com/docs/getting-started/create-pdf#download-in-browser
		const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = fileName;
		link.click();

		URL.revokeObjectURL(url)
	}

	async function redactAndDownload() {
		if (!documentState.file) {
			return;
		}

		const fileName = createRedactedFileName(documentState.file.name);
		const boxesToDraw = documentState.detections.map((detection) => detection.highlightArea);

		isRedacting = true;

		try {
			const { buildRedactedPdf } = await import('$lib/pdf/redact');
			const newPDFBytes = await buildRedactedPdf(documentState.pages, boxesToDraw);

			downloadFile(newPDFBytes, fileName);
		} catch (error) {
			documentState.error = 'The redacted PDF could not be built: ' + error;
		}

		isRedacting = false;
	}
</script>

<svelte:head>
	<title>Local PDF Redactor</title>
</svelte:head>

<section>
	<h1 class="h2 mb-4 text-center">Choose a PDF to redact</h1>

	<input bind:this={fileInput} class="visually-hidden" type="file" accept="application/pdf" onchange={handleFileSelected} />

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
		ondrop={handleFileDropped}
	>
		<span class="d-block fs-4 fw-semibold">Drop a PDF here</span>
		<span class="d-block mt-2 text-body-secondary">or choose a file from your device</span>
	</button>

	{#if documentState.file}
		<p class="mt-3 mb-0 text-center" aria-live="polite">
			Selected: {documentState.file.name}
			{#if documentState.pages.length > 0}
				<span class="text-body-secondary">
					({documentState.pages.length}
					{documentState.pages.length === 1 ? 'page' : 'pages'})
				</span>
			{/if}
		</p>
		{#if documentState.pages.length > 0}
			<p class="mt-1 mb-0 text-center">
				Found {documentState.detections.length}
				{documentState.detections.length === 1 ? 'item' : 'items'} with personal information
			</p>
		{/if}
	{/if}

	{#if documentState.error}
		<p class="alert alert-danger mt-3 mb-0" role="alert">{documentState.error}</p>
	{/if}

	{#if documentState.pages.length > 0}
		<div class="mt-4">
			{#each documentState.pages as page (page.pageNumber)}
				<PagePreview
					{page}
					detections={documentState.detections.filter((detection) => detection.pageNumber === page.pageNumber)}
				/>
			{/each}
		</div>

		<div class="text-center">
			<button class="btn btn-dark btn-lg" type="button" disabled={isRedacting} onclick={redactAndDownload}>
				{#if isRedacting}
					<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
					Building redacted PDF
				{:else}
					Redact and download
				{/if}
			</button>
		</div>
	{/if}
</section>

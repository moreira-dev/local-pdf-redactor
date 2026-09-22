<script lang="ts">
	import { asset } from '$app/paths';
	import Examples from '$lib/components/landing/Examples.svelte';
	import Faq from '$lib/components/landing/Faq.svelte';
	import PagePreview from '$lib/components/pdf/PagePreview.svelte';
	import { DocumentState } from '$lib/state/document.svelte';

	interface SamplePdf {
		fileName: string;
		url: string;
	}

	const samplePayslip: SamplePdf = { fileName: 'payslip.pdf', url: asset('/samples/payslip.pdf') };
	const sampleMedicalCertificate: SamplePdf = {
		fileName: 'medical-certificate.pdf',
		url: asset('/samples/medical-certificate.pdf'),
	};

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

	async function handleSampleSelected(sample: SamplePdf) {
		try {
			const response = await fetch(sample.url);

			if (!response.ok) {
				throw new Error(`Can't read the file. Error ${response.status}.`);
			}

			const blob = await response.blob();

			documentState.select(new File([blob], sample.fileName, { type: 'application/pdf' }));
		} catch (error) {
			const message = error instanceof Error ? error.message : error;
			documentState.error = 'The sample PDF could not be loaded: ' + message;
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

		URL.revokeObjectURL(url);
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

<section class="pb-5">
	<div class="container">
		<div class="col-lg-8 mx-auto">
			<h1>Redact your <span class="inverted px-3">PDF</span></h1>
			<p class="lead mb-4">
				This tool runs entirely on your device to protect your privacy.<br/>
				Powered by <a href="https://huggingface.co/onnx-community/bert-small-pii-detection-ONNX/" target="_blank">lightweight AI models</a> that run directly in your browser,
				it automatically finds and redacts personal details like names, addresses and bank numbers from your PDFs.
			</p>

			<input bind:this={fileInput} class="visually-hidden" type="file" accept="application/pdf" onchange={handleFileSelected} />

			<button
				class:dragging={isDragging}
				class="drop-zone surface w-100 border p-5 text-center"
				type="button"
				onclick={() => fileInput.click()}
				ondragover={(event) => {
					event.preventDefault();
					isDragging = true;
				}}
				ondragleave={() => (isDragging = false)}
				ondrop={handleFileDropped}
			>
				<i class="bi bi-file-earmark-pdf d-block h1 mb-0" aria-hidden="true"></i>
				<span class="d-block mt-2 lead fw-bold">Drop a document here or click to browse</span>
				<span class="d-block mt-1 small text-body-secondary">Documents never leave your machine</span>
			</button>

			<p class="mt-4 mb-0 text-center text-body-secondary">
				Try it with a
				<button class="btn btn-link p-0 align-baseline" type="button" onclick={() => handleSampleSelected(samplePayslip)}>
					sample payslip
				</button>
				or a
				<button
					class="btn btn-link p-0 align-baseline"
					type="button"
					onclick={() => handleSampleSelected(sampleMedicalCertificate)}
				>
					sample medical certificate
				</button>.
			</p>

			{#if documentState.error}
				<p class="alert alert-danger mt-4 mb-0" role="alert">{documentState.error}</p>
			{/if}

			{#if documentState.file}
				<div class="card surface border mt-5">
					<div class="card-header inverted d-flex justify-content-between gap-3" aria-live="polite">
						<span class="text-break">{documentState.file.name}</span>
						{#if documentState.pages.length > 0}
							<span class="text-nowrap">
								{documentState.pages.length}
								{documentState.pages.length === 1 ? 'page' : 'pages'}
							</span>
						{/if}
					</div>

					{#if documentState.pages.length > 0}
						<div class="card-body border-bottom">
							{#if documentState.isScanning}
								<p class="mb-0">
									<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
									Scanning for personal information. Found {documentState.detections.length} so far.
								</p>
							{:else}
								<p class="mb-1">
									Found {documentState.detections.length}
									{documentState.detections.length === 1 ? 'item' : 'items'} with personal information
								</p>
								<p class="mb-0 small fw-semibold text-body-secondary">
									<span class="legend deterministic"></span> Deterministic
									<span class="legend model ms-3"></span> Local AI model
								</p>
							{/if}
						</div>

						<div class="card-body text-center">
							{#each documentState.pages as page (page.pageNumber)}
								<PagePreview
									{page}
									detections={documentState.detections.filter((detection) => detection.pageNumber === page.pageNumber)}
								/>
							{/each}
						</div>
					{/if}
				</div>

				{#if documentState.pages.length > 0}
					<button
						class="btn btn-primary btn-lg w-100 mt-4"
						type="button"
						disabled={isRedacting || documentState.isScanning}
						onclick={redactAndDownload}
					>
						{#if isRedacting}
							<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
							Building redacted PDF
						{:else}
							Redact and download <i class="bi bi-download ms-2" aria-hidden="true"></i>
						{/if}
					</button>
				{/if}
			{/if}
		</div>
	</div>
</section>

<Examples />

<Faq />

<style>
	.drop-zone {
		--bs-border-style: dashed;
	}

	.drop-zone.dragging {
		background-color: var(--color-accent);
	}

	.legend {
		display: inline-block;
		width: 1em;
		height: 1em;
		vertical-align: -0.125em;
	}

	.legend.deterministic {
		border: 2px solid var(--bs-warning);
		background-color: rgba(var(--bs-warning-rgb), 0.35);
	}

	.legend.model {
		border: 2px solid var(--bs-primary);
		background-color: rgba(var(--bs-primary-rgb), 0.25);
	}
</style>

<script lang="ts">
	import type { PDFPageProxy } from 'pdfjs-dist';

	const previewScale = 1.5;

	let { page }: { page: PDFPageProxy } = $props();

	let canvas = $state<HTMLCanvasElement>();

	$effect(() => {
		if (!canvas) {
			return;
		}

		const viewport = page.getViewport({ scale: previewScale });

		canvas.width = viewport.width;
		canvas.height = viewport.height;

		const task = page.render({ canvas, viewport });

		return () => task.cancel();
	});
</script>

<figure class="mb-4">
	<canvas bind:this={canvas} class="border shadow-sm" aria-label="Page {page.pageNumber}"></canvas>
	<figcaption class="mt-2 small text-body-secondary">Page {page.pageNumber}</figcaption>
</figure>

<style>
	canvas {
		max-width: 100%;
		height: auto;
	}
</style>

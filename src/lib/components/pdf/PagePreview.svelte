<script lang="ts">
	import type { PDFPageProxy } from 'pdfjs-dist';
	import Highlight from '$lib/components/pdf/Highlight.svelte';
	import type { PIIData } from '$lib/types';

	const previewScale = 1.5;

	let { page, detections }: { page: PDFPageProxy; detections: PIIData[] } = $props();

	let canvas = $state<HTMLCanvasElement>();

	const viewport = $derived(page.getViewport({ scale: previewScale }));

	$effect(() => {
		if (!canvas) {
			return;
		}

		canvas.width = viewport.width;
		canvas.height = viewport.height;

		const task = page.render({ canvas, viewport });

		return () => task.cancel();
	});
</script>

<figure class="mb-4">
	<div class="page border">
		<canvas bind:this={canvas} aria-label="Page {page.pageNumber}"></canvas>

		{#each detections as detection}
			<Highlight area={detection.highlightArea} {viewport} foundBy={detection.foundBy} />
		{/each}
	</div>
	<figcaption class="mt-2 small text-body-secondary">Page {page.pageNumber}</figcaption>
</figure>

<style>
	.page {
		position: relative;
		display: inline-block;
		max-width: 100%;
	}

	canvas {
		display: block;
		max-width: 100%;
		height: auto;
	}
</style>

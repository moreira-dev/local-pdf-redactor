<script lang="ts">
	import type { PageViewport } from 'pdfjs-dist';
	import type { Box } from '$lib/types';

	let { area, viewport }: { area: Box; viewport: PageViewport } = $props();

	const position = $derived(toPagePercentages(area, viewport));

	/**
	 * Converts a box in PDF points into percentages of the page, so the highlight follows the canvas when CSS resizes it.
	 */
	function toPagePercentages(box: Box, pageViewport: PageViewport) {
		const [firstX, firstY]: number[] = pageViewport.convertToViewportPoint(box.x, box.y);
		const [secondX, secondY]: number[] = pageViewport.convertToViewportPoint(box.x + box.width, box.y + box.height);

		const left = Math.min(firstX, secondX);
		const top = Math.min(firstY, secondY);
		const width = Math.abs(secondX - firstX);
		const height = Math.abs(secondY - firstY);

		return {
			left: (left / pageViewport.width) * 100,
			top: (top / pageViewport.height) * 100,
			width: (width / pageViewport.width) * 100,
			height: (height / pageViewport.height) * 100,
		};
	}
</script>

<div
	class="highlight"
	style:left="{position.left}%"
	style:top="{position.top}%"
	style:width="{position.width}%"
	style:height="{position.height}%"
></div>

<style>
	.highlight {
		position: absolute;
		border: 2px solid var(--bs-warning);
		background-color: rgba(var(--bs-warning-rgb), 0.35);
	}
</style>

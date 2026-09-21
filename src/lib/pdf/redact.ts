import { PDF } from '@libpdf/core';
import type { PDFPageProxy } from 'pdfjs-dist';
import type { Box } from '$lib/types';

const outputScale = 2;
const jpegQuality = 0.92;

/**
 * Converts the canvas into a JPEG blob that can be embedded.
 */
function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error('The page could not be turned into an image.'));
				}
			},
			'image/jpeg',
			jpegQuality,
		);
	});
}

/**
 * Renders a page to pixels and paints the boxes black, so nothing under them survives.
 */
async function createRedactedPageImage(page: PDFPageProxy, boxes: Box[]): Promise<Uint8Array> {
	const viewport = page.getViewport({ scale: outputScale });
	const canvas = document.createElement('canvas');
	// Can't use decimals on canvas
	canvas.width = Math.ceil(viewport.width);
	canvas.height = Math.ceil(viewport.height);

	const renderContext = {
		canvas,
		viewport
	};
	await page.render(renderContext).promise;

	const canvasContext = canvas.getContext('2d');

	if (!canvasContext) {
		throw new Error('Canvas 2D is not available.');
	}

	// We have to use setTransform to translate the viewport dimensions to canvas pixels
	const [scaleX, skewY, skewX, scaleY, translateX, translateY] = viewport.transform;
	canvasContext.setTransform(scaleX, skewY, skewX, scaleY, translateX, translateY);
	canvasContext.fillStyle = '#cbd5e1';
	canvasContext.strokeStyle = '#94a3b8';
	canvasContext.lineWidth = 1;

	for (const box of boxes) {
		canvasContext.fillRect(box.x, box.y, box.width, box.height);
		canvasContext.strokeRect(box.x, box.y, box.width, box.height);
	}

	const jpeg = await canvasToJpeg(canvas);

	canvas.width = 0;
	canvas.height = 0;

	return new Uint8Array(await jpeg.arrayBuffer());
}

/**
 * Creates a new redacted PDF as a JPG image.
 */
export async function buildRedactedPdf(pages: PDFPageProxy[], boxes: Box[]): Promise<Uint8Array> {
	const output = PDF.create();

	// TODO look for ways to avoid having to convert the output PDF to an image to guarantee privacy

	for (const page of pages) {
		const pageBoxes = boxes.filter((box) => box.pageNumber === page.pageNumber);
		const pageImage = await createRedactedPageImage(page, pageBoxes);
		const pageSize = page.getViewport({ scale: 1 });

		const outputPage = output.addPage({
			width: pageSize.width,
			height: pageSize.height,
		});
		const image = output.embedJpeg(pageImage);

		outputPage.drawImage(image, {
			x: 0,
			y: 0,
			width: pageSize.width,
			height: pageSize.height,
		});
	}

	return output.save();
}

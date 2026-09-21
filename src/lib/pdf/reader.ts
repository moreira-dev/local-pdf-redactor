import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { TransformMatrix, TextLine, TextPiece } from '$lib/types';

function initPdfWorker() {
	if (pdfjs.GlobalWorkerOptions.workerSrc !== workerUrl) {
		pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
	}
}

export async function loadPdf(file: File): Promise<PDFDocumentProxy> {
	initPdfWorker();
	const data = await file.arrayBuffer();

	return pdfjs.getDocument({ data }).promise;
}

export async function getPages(pdf: PDFDocumentProxy): Promise<PDFPageProxy[]> {
	const pagePromises: Promise<PDFPageProxy>[] = [];

	for (let i = 1; i <= pdf.numPages; i++) {
		pagePromises.push(pdf.getPage(i));
	}

	// TODO doing this could cause 400 page PDFs to crash the browser
	return Promise.all(pagePromises);
}

/**
 * Checks if the given item is visible text.
 */
function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
	return 'str' in item;
}

/**
 * Processes a {@link TextItem} so that we can easily manipulate the text and understand its font size
 */
function toPiece(item: TextItem, fontFamily: string): TextPiece {
	const [scaleX, skewY, skewX, scaleY, translateX, translateY] = item.transform;
	const transform: TransformMatrix = {
		scaleX,
		skewY,
		skewX,
		scaleY,
		translateX,
		translateY,
	};

	return {
		text: item.str,
		start: 0,
		transform,
		width: item.width,
		fontName: item.fontName,
		fontFamily,
		fontSize: Math.hypot(transform.skewX, transform.scaleY),
	};
}

function endsWithWhitespace(text: string): boolean {
	return /\s$/.test(text);
}

function startsWithWhitespace(text: string): boolean {
	return /^\s/.test(text);
}

function needsSpace(previousWord: TextPiece, currentWord: TextPiece): boolean {
	if (endsWithWhitespace(previousWord.text) || startsWithWhitespace(currentWord.text)) {
		return false;
	}

	// TODO this logic might not work for rtl documents
	const wordGapRatio = 0.2; // How much gap between words to consider them part of the same line
	const previousEnd = previousWord.transform.translateX + previousWord.width;
	const gap = currentWord.transform.translateX - previousEnd;

	return gap > previousWord.fontSize * wordGapRatio;
}

/**
 * Creates a readable {@link TextLine} from a list of {@link TextPiece}s.
 */
function createTextLineFromPieces(pageNumber: number, pieces: TextPiece[]): TextLine {
	const sortedPieces = [...pieces].sort((left, right) => left.transform.translateX - right.transform.translateX);

	let text = '';
	let previous: TextPiece | undefined;

	for (const piece of sortedPieces) {
		if (previous && needsSpace(previous, piece)) {
			text += ' ';
		}

		piece.start = text.length;
		text += piece.text;
		previous = piece;
	}

	return { pageNumber, text, pieces: sortedPieces };
}

/**
 * Decomposes a PDF page into a list of readable {@link TextLine}s.
 * This is useful to then feed the text (in the right order) to a LLM for further processing.
 */
export async function getTextLines(page: PDFPageProxy): Promise<TextLine[]> {
	const content = await page.getTextContent();
	const textRows: { translateY: number; pieces: TextPiece[] }[] = [];

	for (const item of content.items) {
		// Only get visible text
		if (!isTextItem(item) || item.str.trim() === '') {
			continue;
		}

		const fontFamily = content.styles[item.fontName]?.fontFamily ?? 'sans-serif';
		const piece = toPiece(item, fontFamily);

		// If our text is on position 20, with a font-size of 10, we want to check if there is
		// already a row in position 17 to 23, and if so we consider this text part of the same row.
		// We do this because PDFs aren't great at drawing text vertically on the same line
		const translateY = piece.transform.translateY;
		const tolerance = piece.fontSize / 3;
		const row = textRows.find((row) => Math.abs(row.translateY - translateY) < tolerance);

		if (row) {
			row.pieces.push(piece);
		} else {
			textRows.push({ translateY, pieces: [piece] });
		}
	}

	// Makes sure rows are sorted vertically top to bottom
	textRows.sort((topRow, bottomRow) => bottomRow.translateY - topRow.translateY);

	const lines: TextLine[] = [];

	for (const row of textRows) {
		lines.push(createTextLineFromPieces(page.pageNumber, row.pieces));
	}

	return lines;
}

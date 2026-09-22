import type { Box, TextLine, TextPiece } from '$lib/types';

let sharedCanvas: CanvasRenderingContext2D | undefined;

function getCanvas(): CanvasRenderingContext2D {
	if (!sharedCanvas) {
		const canvasContext = document.createElement('canvas').getContext('2d');

		if (!canvasContext) {
			throw new Error('Canvas 2D is not available.');
		}

		sharedCanvas = canvasContext;
	}

	return sharedCanvas;
}

/**
 * Calculates how many pt wide a specific number of characters is in a given piece.
 * We measure the text width in pixels first because it's easy, and extrapolate the width in pt from it.
 */
function getTextWidthInPT(piece: TextPiece, numberOfLetters: number): number {
	if (numberOfLetters === 0) {
		return 0;
	}

	const canvas = getCanvas();
	canvas.font = `${piece.fontSize}px ${piece.fontFamily}`;

	const fullTextWidth = canvas.measureText(piece.text).width;
	const textToMeasure = piece.text.slice(0, numberOfLetters);

	if (fullTextWidth === 0) {
		return 0;
	}

	const textWidth = canvas.measureText(textToMeasure).width;
	const percentagePixelWidth = textWidth / fullTextWidth;

	return percentagePixelWidth * piece.width;
}

/**
 * Creates a box covering a single piece of text within a line.
 */
function createPieceBox(pageNumber: number, piece: TextPiece, firstIndex: number, lastIndex: number): Box {
	const boxPadding = {
		top: piece.fontSize * 0.1,
		bottom: piece.fontSize * 0.3,
		horizontal: piece.fontSize * 0.3,
	};

	const leftEdge = piece.transform.translateX + getTextWidthInPT(piece, firstIndex) - boxPadding.horizontal;
	const rightEdge = piece.transform.translateX + getTextWidthInPT(piece, lastIndex + 1) + boxPadding.horizontal;
	const bottom = piece.transform.translateY - boxPadding.bottom;
	const top = piece.transform.translateY + piece.fontSize + boxPadding.top;

	return {
		pageNumber,
		x: leftEdge,
		y: bottom,
		width: rightEdge - leftEdge,
		height: top - bottom,
	};
}

/**
 * Creates a single box that covers all of the given boxes.
 */
function mergeBoxes(boxes: Box[]): Box {
	let left = boxes[0].x;
	let bottom = boxes[0].y;
	let right = boxes[0].x + boxes[0].width;
	let top = boxes[0].y + boxes[0].height;

	for (const box of boxes) {
		left = Math.min(left, box.x);
		bottom = Math.min(bottom, box.y);
		right = Math.max(right, box.x + box.width);
		top = Math.max(top, box.y + box.height);
	}

	return {
		pageNumber: boxes[0].pageNumber,
		x: left,
		y: bottom,
		width: right - left,
		height: top - bottom,
	};
}

/**
 * Creates a box that covers the specified characters of a line,
 * from firstCharacterPosition to lastCharacterPosition, inclusive.
 */
export function createBox(line: TextLine, firstCharacterPosition: number, lastCharacterPosition: number): Box | undefined {
	const pieceBoxes: Box[] = [];

	for (const piece of line.pieces) {
		const pieceEnd = piece.start + piece.text.length - 1;

		if (firstCharacterPosition > pieceEnd || lastCharacterPosition < piece.start) {
			// There is nothing to cover in this piece
			continue;
		}

		const firstIndexToCoverInPiece = Math.max(firstCharacterPosition, piece.start) - piece.start;
		const lastIndexToCoverInPiece = Math.min(lastCharacterPosition, pieceEnd) - piece.start;

		pieceBoxes.push(createPieceBox(line.pageNumber, piece, firstIndexToCoverInPiece, lastIndexToCoverInPiece));
	}

	if (pieceBoxes.length === 0) {
		return undefined;
	}

	return mergeBoxes(pieceBoxes);
}

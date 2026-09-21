export type TransformMatrix = {
	scaleX: number,
	skewY: number,
	skewX: number,
	scaleY: number,
	translateX: number,
	translateY: number
};

export interface TextPiece {
	text: string;
	start: number;
	transform: TransformMatrix;
	width: number;
	fontName: string;
	fontFamily: string;
	fontSize: number;
}

export interface TextLine {
	pageNumber: number;
	text: string;
	pieces: TextPiece[];
}

export interface PIIDetection {
	pageNumber: number;
	lineIndex: number;
	start: number;
	end: number;
	label: string;
	text: string;
}

export interface Box {
	pageNumber: number;
	x: number;
	y: number;
	width: number;
	height: number;
}

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

export interface Box {
	pageNumber: number;
	x: number;
	y: number;
	width: number;
	height: number;
}


export type FoundBy = 'deterministic' | 'model';

export interface PIIData {
	pageNumber: number;
	lineIndex: number;
	firstCharacterPosition: number;
	lastCharacterPosition: number;
	category: string;
	text: string;
	highlightArea: Box;
	foundBy: FoundBy;
}


export interface ModelToken {
	word: string; // e.g. "john"
	entity: string; // e.g. "B-PERSON"
}

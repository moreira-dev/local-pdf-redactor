import { tagLines } from '$lib/detection/genai/classifier';
import { createBox } from '$lib/pdf/boxes';
import type { ModelToken, PIIData, TextLine } from '$lib/types';

/**
 * Lowercases and removes accents from a line so that we can compare it with the model output
 *
 * Example input:  "Call José Álvarez"
 * Example output: "call jose alvarez"
 */
function simplifyText(text: string): string {
	let simplifiedText = '';

	for (let i = 0; i < text.length; i++) {
		// normalize('NFD') splits "é" into "e" plus an accent mark, and [0] keeps only the "e".
		simplifiedText += text[i].toLowerCase().normalize('NFD')[0];
	}

	return simplifiedText;
}

/**
 * Tells whether a text has at least one letter or number.
 * \p{L} matches any letter, such as "a", "é" or "李", and \p{N} matches any number
 *
 * Example input:  "Zoë"
 * Example output: true
 *
 * Example input:  "/"
 * Example output: false
 */
function hasLetterOrDigit(text: string): boolean {
	return /[\p{L}\p{N}]/u.test(text);
}

/**
 * Based on a given position, finds the end of a word in the text.
 * To search left use -1
 * To search right use 1
 *
 * Example input:  text "Richmond VIC 3121", position 16 (the last "1"), step -1
 * Example output: 13 (the "3")
 *
 * Example input:  text "Richmond VIC 3121", position 13 (the "3"), step 1
 * Example output: 16 (the last "1")
 */
function findEndOfWord(text: string, position: number, step: number): number {
	// charAt gives "" before the start and after the end of the text, so the walk stops there.
	while (hasLetterOrDigit(text.charAt(position + step))) {
		position += step;
	}

	return position;
}

/**
 * Gets the full word from the PDF text based on the token position
 * and adds it to the PIIData[].
 *
 * Example input:  line.text "Richmond VIC 3121", category "LOCATION", start 16, end 16 (the model tagged only "##1")
 * Example output: adds { category: "LOCATION", text: "3121", firstCharacterPosition: 13, lastCharacterPosition: 16, ... }
 */
function addPII(foundPIIList: PIIData[], line: TextLine, lineIndex: number, category: string, start: number, end: number): void {
	if (category === '') {
		return;
	}

	const firstCharacterPosition = findEndOfWord(line.text, start, -1);
	const lastCharacterPosition = findEndOfWord(line.text, end, 1);
	const text = line.text.slice(firstCharacterPosition, lastCharacterPosition + 1);
	const highlightArea = createBox(line, firstCharacterPosition, lastCharacterPosition);

	if (!hasLetterOrDigit(text) || !highlightArea) {
		return;
	}

	foundPIIList.push({
		pageNumber: line.pageNumber,
		lineIndex,
		firstCharacterPosition,
		lastCharacterPosition,
		category,
		text,
		highlightArea,
	});
}

/**
 * Returns an array of all found PIIData for a given text line.
 *
 * Example input:
 *   line.text (our line from the PDF): 		  "Call John Doe today"
 *   tokens (tokens as detected by the model):    [{ word: "call", entity: "O" }, { word: "john", entity: "B-PERSON" },
 *               								  { word: "doe", entity: "I-PERSON" }, { word: "today", entity: "O" }]
 * Example output:
 *   [{ category: "PERSON", text: "John Doe", firstCharacterPosition: 5, lastCharacterPosition: 12, ... }]
 */
function findPIIInLine(line: TextLine, lineIndex: number, tokens: ModelToken[]): PIIData[] {
	const searchableText = simplifyText(line.text);
	const foundPIIList: PIIData[] = [];
	let cursor = 0;
	let groupCategory = '';
	let groupStart = 0;

	for (const token of tokens) {
		// The model cuts long words into pieces, like "312" and "##1" for "3121"
		const word = token.word.replace('##', '');
		const position = searchableText.indexOf(word, cursor);

		// If a token is not found, it's probably a special character
		if (position === -1) {
			continue;
		}

		// slice(2) makes "B-PERSON" and "I-PERSON" become "PERSON", and the label "O" become "".
		if (token.entity.startsWith('B-') || token.entity.slice(2) !== groupCategory) {
			addPII(foundPIIList, line, lineIndex, groupCategory, groupStart, cursor - 1);
			groupCategory = token.entity.slice(2);
			groupStart = position;
		}

		// move the cursor pointer so that we start searching words from its position in the next indexOf
		cursor = position + word.length;
	}

	addPII(foundPIIList, line, lineIndex, groupCategory, groupStart, cursor - 1);

	return foundPIIList;
}

/**
 * Checks all lines for PII using GenAI models.
 *
 * Example input:  [{ text: "Employee: John Doe", ... }, { text: "Pay date: 05/08/2026", ... }]
 * Example output: [{ lineIndex: 0, category: "PERSON", text: "John Doe", ... },
 *                  { lineIndex: 1, category: "DATE_TIME", text: "05/08/2026", ... }]
 */
export async function findPIIByModel(lines: TextLine[]): Promise<PIIData[]> {
	if (lines.length === 0) {
		return [];
	}

	const texts = lines.map((line) => line.text);
	const tokensPerLine = await tagLines(texts);
	const foundPIIList: PIIData[] = [];

	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		foundPIIList.push(...findPIIInLine(lines[lineIndex], lineIndex, tokensPerLine[lineIndex]));
	}

	return foundPIIList;
}

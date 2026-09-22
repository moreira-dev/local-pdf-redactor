import { createBox } from '$lib/pdf/boxes';
import type { PIIData, TextLine } from '$lib/types';

interface Rule {
	category: string;
	pattern: RegExp;
}

/**
 * Matches months in abbreviated or full forms
 * Matches: 'Jan', 'January', 'Oct.', 'August'
 */
const month = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?';

/**
 * Matches numeric dates separated by slashes, dots, or hyphens, or alphanumeric dates
 * Matches: '12/05/2026', '1-5-24', '12 Jan 2024', '4 October 1990'
 */
const date = `(?:\\d{1,2}[/.-]\\d{1,2}[/.-](?:\\d{4}|\\d{2})|\\d{1,2}\\s+${month}\\s+\\d{4})`;

/**
 * Matches common prefixes used to indicate a date of birth.
 * Matches: 'DOB', 'D.O.B.', 'Date of birth', 'Birth date', 'Born'
 */
const birthLabel = '(?:DOB|D\\.O\\.B\\.?|Date of birth|Birth date|Born)';

const rules: Rule[] = [
	/**
	 * Matches: 'hello@example.com', 'user.name+tag@domain.com.au'
	 */
	{ category: 'EMAIL_ADDRESS', pattern: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g },

	/**
	 * Australian mobile and state landline numbers, handling international +61 and local (0X) prefixes.
	 * Matches: '+61 412 345 678', '(03) 9876 5432', '0412345678'
	 */
	{ category: 'PHONE_NUMBER', pattern: /(?<![\w+])(?:\+61[\s-]?|\(?0)[2-478]\)?(?:[\s-]?\d){8}(?!\d)/g },

	/**
	 * Australian toll-free and business numbers (1300 and 1800 prefixes).
	 * Matches: '1300 123 456', '1800-123-456', '1300123456'
	 */
	{ category: 'PHONE_NUMBER', pattern: /(?<!\d)1[38]00(?:[\s-]?\d){6}(?!\d)/g },

	/**
	 * Bank State Branch (BSB) numbers strictly preceded by an explicit 'BSB' label.
	 * Matches: '062-123' in 'BSB: 062-123', matches '062 123' in 'BSB 062 123'
	 */
	{ category: 'FINANCIAL', pattern: /(?<=\bBSB\b[:#\s]*)\d{3}[\s-]?\d{3}(?!\d)/gi },

	/**
	 * BSB numbers hyphenated.
	 * Matches: '062-123', '999-999'
	 */
	{ category: 'FINANCIAL', pattern: /(?<!\d)\d{3}-\d{3}(?!\d)/g },

	/**
	 * Strictly matches dates that immediately follow a recognised DOB label.
	 * Matches: '12/05/1990' in 'DOB: 12/05/1990', matches '12 Jan 1990' in 'Born 12 Jan 1990'
	 */
	{ category: 'DATE_TIME', pattern: new RegExp(`(?<=\\b${birthLabel}[:\\s]*)${date}`, 'gi') },
];

/**
 * Checks if we already detected PII in the given string range so that we don't duplicate it.
 */
function isAlreadyFound(foundPIIList: PIIData[], firstCharacterPosition: number, lastCharacterPosition: number): boolean {
	for (const pii of foundPIIList) {
		if (firstCharacterPosition <= pii.lastCharacterPosition && pii.firstCharacterPosition <= lastCharacterPosition) {
			return true;
		}
	}

	return false;
}

/**
 * Get all PII matches for a given line.
 */
function findPIIInLine(line: TextLine, lineIndex: number): PIIData[] {
	const foundPIIList: PIIData[] = [];

	for (const rule of rules) {
		for (const match of line.text.matchAll(rule.pattern)) {
			const firstCharacterPosition = match.index;
			const lastCharacterPosition = match.index + match[0].length - 1;

			if (isAlreadyFound(foundPIIList, firstCharacterPosition, lastCharacterPosition)) {
				continue;
			}

			const highlightArea = createBox(line, firstCharacterPosition, lastCharacterPosition);

			if (!highlightArea) {
				continue;
			}

			foundPIIList.push({
				pageNumber: line.pageNumber,
				lineIndex,
				firstCharacterPosition,
				lastCharacterPosition,
				category: rule.category,
				text: match[0],
				highlightArea,
				foundBy: 'deterministic',
			});
		}
	}

	foundPIIList.sort((left, right) => left.firstCharacterPosition - right.firstCharacterPosition);

	return foundPIIList;
}


/**
 * Checks all lines for PII using deterministic rules.
 */
export function findPIIByDeterministicRules(lines: TextLine[]): PIIData[] {
	const detections: PIIData[] = [];

	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const lineDetections = findPIIInLine(lines[lineIndex], lineIndex);

		detections.push(...lineDetections);
	}

	return detections;
}

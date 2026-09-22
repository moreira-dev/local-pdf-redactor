import { findPIIByDeterministicRules } from '$lib/detection/deterministic/finder';
import { findPIIByModel } from '$lib/detection/ai/finder';
import type { PIIData, TextLine } from '$lib/types';

// The bert-small-pii-detection-ONNX model tags all dates, and titles such as "Dr"
// which in my view are not PII.
const IGNORED_MODEL_CATEGORIES = ['DATE_TIME', 'TITLE'];

/**
 * Checks all given lines for PII using deterministic rules and AI.
 *
 * Example input:  [{ text: "DOB: 04/03/1991 Email: jane@example.com", ... }]
 * Example output: [{ category: "DATE_TIME", text: "04/03/1991", foundBy: "deterministic", ... },
 *                  { category: "EMAIL_ADDRESS", text: "jane@example.com", foundBy: "deterministic", ... },
 *                  { category: "EMAIL_ADDRESS", text: "jane@example.com", foundBy: "model", ... }]
 */
export async function findPII(lines: TextLine[]): Promise<PIIData[]> {
	const ruleDetections = findPIIByDeterministicRules(lines);
	const modelDetections = await findPIIByModel(lines);
	const filteredModelDetections = modelDetections.filter((pii) => !IGNORED_MODEL_CATEGORIES.includes(pii.category));

	return [...ruleDetections, ...filteredModelDetections];
}

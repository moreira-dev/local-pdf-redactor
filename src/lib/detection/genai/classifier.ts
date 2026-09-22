import { pipeline } from '@huggingface/transformers';
import type { TokenClassificationPipeline } from '@huggingface/transformers';
import type { ModelToken } from '$lib/types';

const PII_MODEL_ID = 'onnx-community/bert-small-pii-detection-ONNX';
const DTYPE = 'q8'; // See https://huggingface.co/docs/transformers.js/guides/dtypes for options

let classifierModelLoading: Promise<TokenClassificationPipeline> | undefined;

/**
 * Configures and calls the transformers.js pipeline
 */
async function createClassifier(): Promise<TokenClassificationPipeline> {
	// Check if browser supports webgpu
	const device = (await navigator.gpu?.requestAdapter()) ? 'webgpu' : 'wasm';

	// See https://huggingface.co/docs/transformers.js/pipelines
	return pipeline('token-classification', PII_MODEL_ID, { dtype: DTYPE, device });
}

/**
 * Downloads the model and loads it in memory if not yet loaded
 */
function loadModel(): Promise<TokenClassificationPipeline> {
	if (!classifierModelLoading) {
		classifierModelLoading = createClassifier();
	}

	return classifierModelLoading;
}

/**
 * Returns all words (as tokens) with the relevant category and score for each line.
 * Example for the line: "Bank: Commonwealth Bank"
 * Returns:
   [
     {
         "entity": "O",
         "score": 0.9415231347084045,
         "index": 1,
         "word": "bank"
     },
     {
         "entity": "O",
         "score": 0.9845077991485596,
         "index": 2,
         "word": ":"
     },
     {
         "entity": "B-ORGANIZATION",
         "score": 0.9525459408760071,
         "index": 3,
         "word": "commonwealth"
     },
     {
         "entity": "I-ORGANIZATION",
         "score": 0.9567201733589172,
         "index": 4,
         "word": "bank"
     }
 ]
 */
export async function tagLines(lines: string[]): Promise<ModelToken[][]> {
	const loadedModel = await loadModel();

	return loadedModel(lines, { ignore_labels: [] });
}

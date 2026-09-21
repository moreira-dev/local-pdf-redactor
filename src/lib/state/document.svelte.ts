import type { PDFPageProxy } from 'pdfjs-dist';
import { findPIIByDeterministicRules } from '$lib/detection/rules';
import { getTextLines } from '$lib/pdf/text';
import type { PIIData } from '$lib/types';

export class DocumentState {
	file = $state<File | null>(null);
	pages = $state.raw<PDFPageProxy[]>([]);
	detections = $state<PIIData[]>([]);
	error = $state<string | null>(null);

	numPages = $state(0);

	async select(file?: File) {
		if (!file) {
			return;
		}

		this.reset();

		if (file.type !== 'application/pdf') {
			this.error = 'File must be a PDF.';
			return;
		}

		this.file = file;

		try {
			const { loadPdf, getPages } = await import('$lib/pdf/reader');
			const pdf = await loadPdf(file);

			this.pages = await getPages(pdf);
			this.detections = await this.detect(this.pages);
		} catch {
			this.error = 'The selected PDF could not be read.';
		}
	}

	async detect(pages: PDFPageProxy[]): Promise<PIIData[]> {
		const detections: PIIData[] = [];

		for (const page of pages) {
			const lines = await getTextLines(page);

			detections.push(...findPIIByDeterministicRules(lines));
		}

		return detections;
	}

	reset() {
		this.file = null;
		this.pages = [];
		this.detections = [];
		this.error = null;
	}
}

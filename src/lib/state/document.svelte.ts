import type { PDFPageProxy } from 'pdfjs-dist';
import { getTextLines } from '$lib/pdf/text';
import type { PIIData } from '$lib/types';

export class DocumentState {
	file = $state<File | null>(null);
	pages = $state.raw<PDFPageProxy[]>([]);
	detections = $state<PIIData[]>([]);
	isScanning = $state(false);
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
		} catch {
			this.error = 'The selected PDF could not be read.';
			return;
		}

		await this.scan(file);
	}

	/**
	 * Use AI and deterministic rules to scan the PDF for personal information.
	 * Takes some time to finish
	 */
	async scan(file: File) {
		this.isScanning = true;

		try {
			const { findPII } = await import('$lib/detection/detect');

			for (const page of this.pages) {
				const lines = await getTextLines(page);
				const pageDetections = await findPII(lines);

				if (this.file !== file) {
					// If the user selected a new PDF we should abort this scan
					return;
				}

				this.detections.push(...pageDetections);
			}
		} catch {
			if (this.file === file) {
				this.error = 'The PDF could not be scanned for personal information.';
			}
		} finally {
			if (this.file === file) {
				this.isScanning = false;
			}
		}
	}

	reset() {
		this.file = null;
		this.pages = [];
		this.detections = [];
		this.isScanning = false;
		this.error = null;
	}
}

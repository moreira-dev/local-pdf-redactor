import type { PDFPageProxy } from 'pdfjs-dist';

export class DocumentState {
	file = $state<File | null>(null);
	pages = $state.raw<PDFPageProxy[]>([]);
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
		}
	}

	reset() {
		this.file = null;
		this.pages = [];
		this.error = null;
	}
}

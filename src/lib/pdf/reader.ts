import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

function initPdfWorker() {
	if (pdfjs.GlobalWorkerOptions.workerSrc !== workerUrl) {
		pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
	}
}

export async function loadPdf(file: File): Promise<PDFDocumentProxy> {
	initPdfWorker();
	const data = await file.arrayBuffer();

	return pdfjs.getDocument({ data }).promise;
}

export async function getPages(pdf: PDFDocumentProxy): Promise<PDFPageProxy[]> {
	const pagePromises: Promise<PDFPageProxy>[] = [];

	for (let i = 1; i <= pdf.numPages; i++) {
		pagePromises.push(pdf.getPage(i));
	}

	// TODO doing this could cause 400 page PDFs to crash the browser
	return Promise.all(pagePromises);
}

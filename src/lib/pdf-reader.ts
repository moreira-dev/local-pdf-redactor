import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
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

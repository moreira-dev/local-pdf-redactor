type DocumentSelection = {
	file: File | null;
	error: string | null;
};

export const selectedDocument = $state<DocumentSelection>({
	file: null,
	error: null
});

export function selectDocumentFile(file?: File) {
	if (!file) {
		return;
	}

	if (file.type !== 'application/pdf') {
		selectedDocument.file = null;
		selectedDocument.error = 'File must be a PDF.';
		return;
	}

	selectedDocument.file = file;
	selectedDocument.error = null;
}

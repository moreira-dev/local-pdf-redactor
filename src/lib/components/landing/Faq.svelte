<script lang="ts">
	const questions = [
		{
			question: 'Is my document uploaded anywhere?',
			answer:
				'No. Your browser reads, scans and redacts the file on your device. The server never receives any of your data.',
		},
		{
			question: 'Why is the first scan so slow?',
			answer:
				'The first time you scan a document, your browser downloads a small AI model from Hugging Face. The download is about 35 MB, and your browser keeps a cached copy of it for future uses.',
		},
		{
			question: 'Can someone recover the text I redacted?',
			answer:
				'This tool creates a completely new PDF that never includes the original redacted text. It is virtually impossible to recover the redacted information.',
		},
		{
			question: 'Does my PDF have to have text?',
			answer:
				'At the moment it does. The tool doesn\'t include OCR features yet, so text within images will not be treated in any way.',
		},
		{
			question: 'What is the output format?',
			answer:
				'At the moment, the output PDF will be created as an image. Future versions may include text-based output.',
		},
	];
</script>

<section class="py-5">
	<div class="container">
		<div class="col-lg-8 mx-auto">
			<h2 class="mb-4">FAQs</h2>

			{#each questions as item}
				<details class="surface border mb-3">
					<summary class="p-3 fw-bold">{item.question}</summary>
					<p class="mb-0 px-3 pb-3">{item.answer}</p>
				</details>
			{/each}
		</div>
	</div>
</section>

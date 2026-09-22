# Local PDF Redactor

A browser client-side tool for finding and redacting personal information in PDFs.

Powered by <a href="https://huggingface.co/onnx-community/bert-small-pii-detection-ONNX/" target="_blank">lightweight AI models</a> that run directly in your browser, it automatically finds and redacts personal details like names, addresses and bank numbers from your PDFs.

## Intent

As users increasingly upload sensitive documents to online AI tools like ChatGPT, they often trade away their privacy to benefit from these services. This application provides a quick and easy way to redact personally identifiable information (PII) from PDFs, allowing users to reclaim their data privacy before sharing files online.

The project was created to explore emerging browser APIs like WebGPU and WebNN for local AI execution. These technologies allow machine learning to efficiently run directly on the user's hardware, making applications like this practical to use.

While the opportunities are vast and exciting, the lookout for a consistent level of quality and output from these tools remains a challenge.

## Privacy focused

- **PDFs never leave your device.** No-one but you will see your PDF content.
- **AI runs locally.** The tool downloads a model that runs locally on your machine. Nothing is sent to external APIs.
- **The redaction is one way only.** At the moment the redaction is output as an embedded image inside the PDF, so any areas covered are not recoverable.

## Local AI with Transformers.js

The app uses [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js/) to run the `onnx-community/bert-small-pii-detection-ONNX` token-classification model in the browser. The q8-quantised model is compact enough for practical client-side use.

To aid and compare performance between different methods of detection, this project uses both deterministic and AI algorithms.

| Detector | Used for |
| --- | --- |
| Deterministic rules | Emails, phone numbers, BSBs, DOB, TFN |
| Local AI model | Names, locations, organisations, and context-dependent personal details |

On first use of this app, the application downloads the machine-learning model from Hugging Face (around 40mb). Model is later cached by the browser for future use.

## WebGPU and WebNN

With the rise of computational needs for AI development, modern browsers are exposing APIs that can accelerate local machine learning without the need for external hardware.

### WebGPU

[WebGPU](https://www.w3.org/TR/webgpu/) is a modern browser graphics and compute API. It gives web applications controlled access to a device GPU for parallel work such as model inference. When a compatible adapter is available, Transformers.js runs this application's model with the `webgpu` backend, which can reduce scan time on suitable hardware.

### WebNN

[WebNN](https://www.w3.org/TR/webnn/) is a newer browser API designed specifically for neural-network execution. Instead of exposing general GPU commands like WebGPU, it lets the browser use the device's best available machine-learning accelerator, such as a GPU, NPU, or platform ML runtime.

WebNN has the potential to make local inference more power-efficient and to take advantage of NPUs, especially on newer laptops and mobile devices. This feature is still experimental and gaining browser adoption over time.

### WASM

[WebAssembly](https://webassembly.org/) is a universally supported format that lets browsers execute code at near-native speeds directly on the device's CPU.

This project uses WebAssembly as a fallback when WebGPU or WebNN is not available in the browser.

## Local development

To use and develop this app you can run:

```sh
docker compose up
```

Open [http://localhost:5173](http://localhost:5173). 

To stop the server:

```sh
docker compose down
```

To create a production build while the development container is running:

```sh
docker compose exec dev pnpm build
```

Or, when it is stopped:

```sh
docker compose run --rm dev pnpm build
```

The static site is written to `build/`.

## Technology

- [SvelteKit](https://svelte.dev/docs/kit) with static-site generation
- [pdf.js](https://mozilla.github.io/pdf.js/) for PDF reading, text extraction, and page rendering
- [Transformers.js](https://huggingface.co/docs/transformers.js/) for browser-local PII detection
- [@libpdf/core](https://libpdf.documenso.com/) for creating the redacted PDF
- [Bootstrap](https://getbootstrap.com/) to assist with styling


## Limitations and opportunities for improvement

- PDFs need to be text-based for the detection to work. OCR will be implemented in the future
- The AI model needs fine-tuning for better PII detection. Regional variations can impact the output as well
- Redacted output is generated as an embedded image, losing the benefits of text-based PDFs

## License

See [LICENSE](LICENSE).

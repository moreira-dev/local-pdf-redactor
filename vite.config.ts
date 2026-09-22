import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self', 'blob:', 'wasm-unsafe-eval'],
					'connect-src': ['self', 'https://huggingface.co', 'https://*.hf.co', 'https://cdn.jsdelivr.net'],
					'img-src': ['self', 'data:', 'blob:'],
					'style-src': ['self', 'https://fonts.googleapis.com'],
					'font-src': ['self', 'https://fonts.gstatic.com']
				}
			}
		})
	],
	build: {
		target: 'esnext' // Required for WebGPU/WebNN
	},
	worker: {
		format: 'es'
	}
});

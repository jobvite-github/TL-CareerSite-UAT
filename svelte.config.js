import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: 'index.html'
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/TL-CareerSite-UAT' : ''
		}
	},
	compilerOptions: { experimental: { async: true } }
};

export default config;
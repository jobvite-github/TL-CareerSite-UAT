import 'dotenv/config';
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		paths: {
			base: `/${process.env.VITE_GITHUB_REPO}`
		},
		// Poll for new deploys so open tabs can detect they are running a stale build
		version: {
			pollInterval: 60000
		}
	},
	compilerOptions: { experimental: { async: true } }
};

export default config;
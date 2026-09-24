<script lang="ts">
	let { children } = $props();
	let prefersDark = $state(true);
	let isDark = $state(true);

	function switchTheme() {
		const value = isDark ? 'light' : 'dark';

		isDark = value === 'dark';
		localStorage.setItem('sv:theme', isDark === prefersDark ? 'system' : value);
	}

	$effect(() => {
		document.documentElement.classList.remove('light', 'dark');
		prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

		const theme = localStorage.getItem('sv:theme');

		isDark = !theme
			? prefersDark
			: theme === 'dark' || theme === 'system' && prefersDark;

		document.documentElement.classList.add(isDark ? 'dark' : 'light');
	});
</script>

<svelte:head>
	<title>ReviewAT</title>

	<script>
		{ const theme = localStorage.getItem('sv:theme'); document.documentElement.classList.add( !theme || theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' : theme ); }
	</script>
</svelte:head>

<main class="content">{@render children()}</main>
	
<button
	class="theme-toggle-fixed"
	onclick={switchTheme}
	aria-label="Toggle theme"
>
	<span class="theme-toggle-icon"></span>
</button>

<style>
	:global(html) {
		/* Colors */
		--color--employ-dark-blue: #131F3B;
    --color--employ-light-blue: #BCF3FF;
    --color--employ-blue: #65A9DA;
    --color--employ-purple: #B477D2;
    --color--employ-deep-purple: #281330;
    --color--employ-light-purple: #F1D9FB;
    --color--employ-turquoise: #47A7A1;
    --color--employ-light-turquoise: #C3FFD4;
    --color--employ-dark-turquoise: #003535;
    --color--employ-coral: #F27A53;
    --color--employ-light-coral: #FFEBBB;
    --color--employ-chocolate: #2D1919;
    --color--employ-dark-purple: #8f3db8;

		/* Color Variables */
		--bg-1: #f8f9fc;
		--bg-2: #ffffff;
		--bg-3: #e8eaf0;
		--fg-1: #1e1e1e;
		--fg-2: #444444;
		--fg-3: #aeafad;
		--primary: #8f3db8;
		--primary-fg: #281330;
		--primary-bg: #F1D9FB;
		--secondary: #65A9DA;
		--secondary-fg: #131F3B;
		--secondary-bg: #BCF3FF;
		--success: #0d783f;
		--success-fg: #064e3b;
		--success-bg: #bff8d9;
		--info: #3730a3;
		--info-fg: #332e7f;
		--info-bg: #bbdefb;
		--warning: #f59e0b;
		--warning-fg: #92400e;
		--warning-bg: #fef3c7;
		--error: #ef4444;
		--error-fg: #991b1b;
		--error-bg: #ffcdd2;

		/* WP Variables */
		/* 
		--wp--preset--color--employ-dark-blue: #131F3B;
    --wp--preset--color--employ-light-blue: #BCF3FF;
    --wp--preset--color--employ-blue: #65A9DA;
    --wp--preset--color--employ-purple: #B477D2;
    --wp--preset--color--employ-deep-purple: #281330;
    --wp--preset--color--employ-light-purple: #F1D9FB;
    --wp--preset--color--employ-turquoise: #47A7A1;
    --wp--preset--color--employ-light-turquoise: #C3FFD4;
    --wp--preset--color--employ-dark-turquoise: #003535;
    --wp--preset--color--employ-coral: #F27A53;
    --wp--preset--color--employ-light-coral: #FFEBBB;
    --wp--preset--color--employ-chocolate: #2D1919;
    --wp--preset--color--employ-dark-purple: #8f3db8;

		--wp--preset--color--black: #000000;
    --wp--preset--color--cyan-bluish-gray: #abb8c3;
    --wp--preset--color--white: #ffffff;
    --wp--preset--color--pale-pink: #f78da7;
    --wp--preset--color--vivid-red: #cf2e2e;
    --wp--preset--color--luminous-vivid-orange: #ff6900;
    --wp--preset--color--luminous-vivid-amber: #fcb900;
    --wp--preset--color--light-green-cyan: #7bdcb5;
    --wp--preset--color--vivid-green-cyan: #00d084;
    --wp--preset--color--pale-cyan-blue: #8ed1fc;
    --wp--preset--color--vivid-cyan-blue: #0693e3;
    --wp--preset--color--vivid-purple: #9b51e0;
    --wp--preset--color--employ-light-blue-legacy: #edf3f5;
    --wp--preset--color--employ-light-gray: #f3f7f8;
    --wp--preset--color--employ-blue-legacy: #31479e;
    --wp--preset--color--blue: #57c4e5;
    --wp--preset--color--green: #28b691;
    --wp--preset--color--purple: #d2caeb;
    --wp--preset--color--yellow: #f0cf65;

    --wp--preset--gradient--vivid-cyan-blue-to-vivid-purple: linear-gradient(135deg, rgb(6, 147, 227) 0%, rgb(155, 81, 224) 100%);
    --wp--preset--gradient--light-green-cyan-to-vivid-green-cyan: linear-gradient(135deg, rgb(122, 220, 180) 0%, rgb(0, 208, 130) 100%);
    --wp--preset--gradient--luminous-vivid-amber-to-luminous-vivid-orange: linear-gradient(135deg, rgb(252, 185, 0) 0%, rgb(255, 105, 0) 100%);
    --wp--preset--gradient--luminous-vivid-orange-to-vivid-red: linear-gradient(135deg, rgb(255, 105, 0) 0%, rgb(207, 46, 46) 100%);
    --wp--preset--gradient--very-light-gray-to-cyan-bluish-gray: linear-gradient(135deg, rgb(238, 238, 238) 0%, rgb(169, 184, 195) 100%);
    --wp--preset--gradient--cool-to-warm-spectrum: linear-gradient(135deg, rgb(74, 234, 220) 0%, rgb(151, 120, 209) 20%, rgb(207, 42, 186) 40%, rgb(238, 44, 130) 60%, rgb(251, 105, 98) 80%, rgb(254, 248, 76) 100%);
    --wp--preset--gradient--blush-light-purple: linear-gradient(135deg, rgb(255, 206, 236) 0%, rgb(152, 150, 240) 100%);
    --wp--preset--gradient--blush-bordeaux: linear-gradient(135deg, rgb(254, 205, 165) 0%, rgb(254, 45, 45) 50%, rgb(107, 0, 62) 100%);
    --wp--preset--gradient--luminous-dusk: linear-gradient(135deg, rgb(255, 203, 112) 0%, rgb(199, 81, 192) 50%, rgb(65, 88, 208) 100%);
    --wp--preset--gradient--pale-ocean: linear-gradient(135deg, rgb(255, 245, 203) 0%, rgb(182, 227, 212) 50%, rgb(51, 167, 181) 100%);
    --wp--preset--gradient--electric-grass: linear-gradient(135deg, rgb(202, 248, 128) 0%, rgb(113, 206, 126) 100%);
    --wp--preset--gradient--midnight: linear-gradient(135deg, rgb(2, 3, 129) 0%, rgb(40, 116, 252) 100%);
    --wp--preset--gradient--white-light-gray-gradient: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(243, 247, 248, 1) 100%);
    --wp--preset--gradient--light-dark-blue-gradient: linear-gradient(135deg, rgba(87, 196, 229, 1) 0%, rgba(49, 71, 158, 1) 100%); */

		/* Gradients */
		/* --primary-gradient: linear-gradient(135deg, var(--primary) 0%, var(--fg-3) 100%); */
		--primary-gradient: linear-gradient(135deg, rgb(6, 147, 227) 0%, rgb(155, 81, 224) 100%);
		--primary-gradient--transparent: linear-gradient(135deg, #3cb7ff00 0%, #6c90 100%);
		--primary-gradient--active: linear-gradient(135deg, var(--primary) 80%, var(--secondary) 100%);;
		--success-gradient: linear-gradient(135deg, hsl(148, 76%, 97%) 0%, hsl(148, 84%, 93%) 100%);
		--info-gradient: linear-gradient(135deg, hsl(207, 89%, 96%) 0%, hsl(207, 89%, 86%) 100%);
		--warning-gradient: linear-gradient(135deg, hsl(38, 92%, 95%) 0%, hsl(38, 92%, 85%) 100%);
		--error-gradient: linear-gradient(135deg, hsl(0, 84%, 98%) 0%, hsl(0, 84%, 93%) 100%);

		--border-radius: 8px;
		--font: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
		--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		--primary-shadow-color: rgba(40, 19, 48, 0.2);
		--global-transition: all 0.2s ease;
		color-scheme: light;
		margin: 0;
		background: var(--bg-1);
		color: var(--fg-1);
		font-family: var(--font);
		line-height: 1.6;
		height: calc(100vh - 2rem);
		accent-color: var(--primary) !important;
		min-height: 100vh;
		background-color: var(--bg-1);
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	:global(html.dark) {
		color-scheme: dark;
		--bg-1: #1e1e1e;
		--bg-2: #444444;
		--bg-3: #aeafad;
		--fg-1: #e8eaf0;
		--fg-2: #ffffff;
		--fg-3: #f8f9fc;
		/* --primary-bg: #8f3db8;
		--primary-fg: #F1D9FB;
		--secondary-bg: #131F3B;
		--secondary-fg: #BCF3FF; */
		--success-bg: #064e3b;
		--success-fg: #bff8d9;
		--info-bg: #332e7f;
		--info-fg: #bbdefb;
		--warning-bg: #92400e;
		--warning-fg: #fef3c7;
		--error-bg: #991b1b;
		--error-fg: #ffcdd2;
		--primary-shadow-color: rgba(143, 61, 184, 0.1);
	}

	:global(body) {
		margin: 0;
	}

	main {
		color: var(--fg-1);
		min-height: 100vh;
		width: 100vw;
		display: flex;
		flex-direction: column;
	}

	:global(.container) {
		width: 100%;
		max-width: 1440px;
		margin: 0 auto;
		padding: 2rem 2rem;
		box-sizing: border-box;
		flex: 1;
	}

	.theme-toggle-fixed {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		padding: 0;
		background: var(--bg-2);
		border: 1px solid var(--bg-3);
		border-radius: 50%;
		color: var(--fg-1);
		cursor: pointer;
		transition: var(--global-transition);
		box-shadow: var(--shadow-lg);
		z-index: 1000;
		opacity: 0.7;
	}

	.theme-toggle-fixed:hover {
		transform: scale(1.1);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		border-color: var(--primary);
		opacity: 1;
	}

	.theme-toggle-icon {
		display: inline-block;
		width: 1.5rem;
		height: 1.5rem;
		-webkit-mask-size: 1.5rem;
		mask-size: 1.5rem;
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
		-webkit-mask-position: center;
		mask-position: center;
		background-color: var(--fg-1);
	}

	.theme-toggle-icon {
		mask-image: url('data:image/svg+xml,%3csvg%20xmlns="http://www.w3.org/2000/svg"%20viewBox="0%200%2024%2024"%3e%3cpath%20fill="%23666"%20d="M12%2021q-3.775%200-6.388-2.613T3%2012q0-3.45%202.25-5.988T11%203.05q.625-.075.975.45t-.025%201.1q-.425.65-.638%201.375T11.1%207.5q0%202.25%201.575%203.825T16.5%2012.9q.775%200%201.538-.225t1.362-.625q.525-.35%201.075-.037t.475.987q-.35%203.45-2.937%205.725T12%2021Zm0-2q2.2%200%203.95-1.213t2.55-3.162q-.5.125-1%20.2t-1%20.075q-3.075%200-5.238-2.163T9.1%207.5q0-.5.075-1t.2-1q-1.95.8-3.163%202.55T5%2012q0%202.9%202.05%204.95T12%2019Zm-.25-6.75Z"/%3e%3c/svg%3e');
	}

	:global(html.dark) .theme-toggle-icon {
		mask-image: url("data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3e%3cpath%20fill='%23d4d4d4'%20d='M12%2019a1%201%200%200%201%20.993.883L13%2020v1a1%201%200%200%201-1.993.117L11%2021v-1a1%201%200%200%201%201-1zm6.313-2.09.094.083.7.7a1%201%200%200%201-1.32%201.497l-.094-.083-.7-.7a1%201%200%200%201%201.218-1.567l.102.07zm-11.306.083a1%201%200%200%201%20.083%201.32l-.083.094-.7.7a1%201%200%200%201-1.497-1.32l.083-.094.7-.7a1%201%200%200%201%201.414%200zM4%2011a1%201%200%200%201%20.117%201.993L4%2013H3a1%201%200%200%201-.117-1.993L3%2011h1zm17%200a1%201%200%200%201%20.117%201.993L21%2013h-1a1%201%200%200%201-.117-1.993L20%2011h1zM6.213%204.81l.094.083.7.7a1%201%200%200%201-1.32%201.497l-.094-.083-.7-.7A1%201%200%200%201%206.11%204.74l.102.07zm12.894.083a1%201%200%200%201%20.083%201.32l-.083.094-.7.7a1%201%200%200%201-1.497-1.32l.083-.094.7-.7a1%201%200%200%201%201.414%200zM12%202a1%201%200%200%201%20.993.883L13%203v1a1%201%200%200%201-1.993.117L11%204V3a1%201%200%200%201%201-1zm0%205a5%205%200%201%201-4.995%205.217L7%2012l.005-.217A5%205%200%200%201%2012%207z'/%3e%3c/svg%3e");
	}
</style>
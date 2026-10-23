<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { updated } from '$app/state';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if updated.current}
	<div class="update-banner" role="alert">
		A new version of this app is available.
		<button type="button" onclick={() => location.reload()}>Refresh now</button>
	</div>
{/if}

{@render children()}

<style>
	.update-banner {
		position: sticky;
		top: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 8px 16px;
		background: #fff4ce;
		color: #3b3000;
		font-size: 14px;
		border-bottom: 1px solid #e0c96a;
	}

	.update-banner button {
		padding: 4px 10px;
		border: 1px solid currentColor;
		border-radius: 4px;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}
</style>

<script lang="ts">
  import type { Toast } from '$lib/types';
  import { fly } from 'svelte/transition';

  let {
    toasts = $bindable<Toast[]>([])
  } = $props();
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div class="toast toast-{toast.type}" in:fly={{ x: 100, duration: 300 }} out:fly={{ x: 100, duration: 500 }}>
      {toast.message}
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 10000;
  }

  .toast {
    padding: 1rem 1.5rem;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    font-weight: 500;
    min-width: 250px;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .toast-success {
    background: #4CAF50;
    color: white;
  }

  .toast-error {
    background: #f44336;
    color: white;
  }

  .toast-info {
    background: #2196F3;
    color: white;
  }
</style>

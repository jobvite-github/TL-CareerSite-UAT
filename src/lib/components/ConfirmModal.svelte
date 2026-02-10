<script lang="ts">
  import { trapFocus } from '$lib/utils';

  let {
    show = false,
    type = 'delete', // 'delete' | 'unsaved'
    onConfirm,
    onCancel,
    onDiscard,
    onSave
  }: {
    show: boolean;
    type?: 'delete' | 'unsaved';
    onConfirm?: () => void;
    onCancel: () => void;
    onDiscard?: () => void;
    onSave?: () => void;
  } = $props();

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.code === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }
</script>

{#if show}
  <div 
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={handleOverlayClick}
    onkeydown={handleKeydown}
  >
    <div class="modal modal-small" {@attach trapFocus}>
      <div class="modal-header">
        <h2>{type === 'delete' ? 'Confirm Delete' : 'Unsaved Changes'}</h2>
      </div>
      <div class="modal-body">
        {#if type === 'delete'}
          <p>Are you sure you want to delete this task? This action cannot be undone.</p>
        {:else}
          <p>You have unsaved changes. What would you like to do?</p>
        {/if}
      </div>
      <div class="modal-footer">
        {#if type === 'delete'}
          <button class="cancel-btn" onclick={onCancel}>Cancel</button>
          <button class="delete-confirm-btn" onclick={onConfirm}>Delete</button>
        {:else}
          <button class="cancel-btn" onclick={onCancel}>Keep Editing</button>
          <button class="delete-confirm-btn" onclick={onDiscard}>Discard</button>
          <button class="save-btn" onclick={onSave}>Save</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: var(--bg-2);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .modal-small {
    max-width: 450px;
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--bg-3);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h2 {
    margin: 0;
    color: var(--fg-1);
    font-size: 1.5rem;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .modal-body p {
    margin: 0;
    color: var(--fg-1);
    line-height: 1.6;
  }

  .modal-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--bg-3);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .modal-footer button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: background 0.2s;
  }

  .cancel-btn {
    background: var(--bg-3);
    color: var(--fg-1);
  }

  .cancel-btn:hover {
    background: var(--bg-1);
  }

  .save-btn {
    background: #4CAF50;
    color: white;
  }

  .save-btn:hover {
    background: #45a049;
  }

  .delete-confirm-btn {
    background: #f44336;
    color: white;
  }

  .delete-confirm-btn:hover {
    background: #d32f2f;
  }

  @media (max-width: 768px) {
    .modal {
      width: 95%;
    }
  }
</style>

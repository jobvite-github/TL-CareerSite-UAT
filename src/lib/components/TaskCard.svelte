<script lang="ts">
  import type { Task, ColumnId } from '$lib/types';

  let {
    item,
    columnId,
    isDragging = false,
    isReadOnly = false,
    isAdmin = false,
    onDragStart,
    onClick,
    onToggleLock
  }: {
    item: Task;
    columnId: ColumnId;
    isDragging?: boolean;
    isReadOnly?: boolean;
    isAdmin?: boolean;
    onDragStart: (e: DragEvent, item: Task, columnId: ColumnId) => void;
    onClick: (item: Task, columnId: ColumnId) => void;
    onToggleLock?: (itemId: number) => void;
  } = $props();

  function handleDragStart(e: DragEvent) {
    if (isReadOnly) {
      e.preventDefault();
      return;
    }
    onDragStart(e, item, columnId);
  }

  function handleClick() {
    // Always allow clicking to view the task
    onClick(item, columnId);
  }

  function handleKeydown(e: KeyboardEvent) {
    // Always allow keyboard access to view the task
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      onClick(item, columnId);
    }
  }

  function handleLockToggle(e: MouseEvent) {
    e.stopPropagation();
    if (onToggleLock) {
      onToggleLock(item.id);
    }
  }
</script>

<div 
  class="item"
  class:being-dragged={isDragging}
  class:read-only={isReadOnly}
  role="button"
  draggable={!isReadOnly}
  tabindex="0"
  aria-label="Task: {item.description}. Type: {item.type}. {isReadOnly ? 'Click to view (read-only). Drag disabled.' : 'Click to edit, drag to move.'}"
  ondragstart={handleDragStart}
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  <div class="item-content">
      <p class="item-description">{item.description}</p>
      {#if item.owner || (item.feedback && item.feedback.length > 0)}
        <div class="item-owner-row">
          {#if item.owner}
            <div class="item-owner">
              <span class="owner-label">Owner:</span>
              <span 
                class="owner-value" 
                class:owner-cws-dev={item.owner === 'CWS Dev'}
                class:owner-pm={item.owner === 'PM'}
                class:owner-customer={item.owner === 'Customer'}
              >{item.owner}</span>
            </div>
          {/if}
          {#if item.feedback && item.feedback.length > 0}
            <div class="item-feedback-badge">
              <span class="feedback-icon">💬</span>
              <span class="feedback-count">{item.feedback.length}</span>
            </div>
          {/if}
        </div>
      {/if}
      {#if item.images && item.images.length > 0}
        <div class="item-images">
          {#each item.images.slice(0, 3) as image, index}
            <button
              class="item-image-thumb"
              aria-label="View image {index + 1}"
              type="button"
            >
              <img src={image} alt="Attachment {index + 1}" />
            </button>
          {/each}
          {#if item.images.length > 3}
            <div class="item-image-more">
              +{item.images.length - 3}
            </div>
          {/if}
        </div>
      {/if}
      {#if item.type || isAdmin}
         <div class="item-header">
           {#if item.type}
             <span class="item-type">{item.type}</span>
           {:else}
             <span class="item-type-none"></span>
           {/if}
           {#if isAdmin}
             <button
               class="lock-toggle"
               onclick={handleLockToggle}
               aria-label={item.locked ? 'Unlock task' : 'Lock task'}
               title={item.locked ? 'Click to unlock task' : 'Click to lock task'}
             >
               {item.locked ? '🔒' : '🔓'}
             </button>
           {/if}
         </div>
      {/if}
  </div>
</div>

<style>
  .item {
    background: white;
    padding: 1.125rem;
    border-radius: var(--border-radius);
    cursor: grab;
    border: 1px solid var(--bg-3);
    transition: all 0.2s;
    position: relative;
    user-select: none;
    box-shadow: var(--shadow-sm);
  }
  
  .item.read-only {
    cursor: pointer;
    opacity: 0.85;
  }

  .item:not(.read-only):hover {
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .item:not(.read-only):focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  .item.being-dragged {
    opacity: 0.5;
    cursor: grabbing;
  }

  .item-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .lock-toggle {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    line-height: 1;
    opacity: 0.7;
    transition: opacity 0.2s, transform 0.2s;
    z-index: 1;
  }

  .lock-toggle:hover {
    opacity: 1;
    transform: scale(1.1);
  }

  .lock-toggle:focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    border-radius: var(--border-radius);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .item-type {
    font-size: 0.625rem;
    padding: 0.375rem 0.875rem;
    border-radius: 16px;
    background: var(--primary-light);
    color: var(--primary);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .item-description {
    margin: 0;
    color: var(--fg-1);
    font-weight: 500;
    line-height: 1.5;
    display: -webkit-box;
    line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .item-owner-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .item-owner {
    display: flex;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--fg-2);
  }

  .owner-label {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .owner-value {
    font-weight: 500;
  }

  /* CWS Dev - info colors */
  .owner-value.owner-cws-dev {
    color: var(--info);
  }

  :global(.dark) .owner-value.owner-cws-dev {
    color: var(--info-light);
  }

  /* PM - warning colors */
  .owner-value.owner-pm {
    color: var(--warning);
  }

  :global(.dark) .owner-value.owner-pm {
    color: var(--warning-light);
  }

  /* Customer - error colors */
  .owner-value.owner-customer {
    color: var(--error);
  }

  :global(.dark) .owner-value.owner-customer {
    color: var(--error-light);
  }

  .item-images {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .item-image-thumb {
    width: 50px;
    height: 50px;
    border-radius: var(--border-radius);
    overflow: hidden;
    border: 1px solid var(--bg-3);
    padding: 0;
    background: none;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: var(--shadow-sm);
  }

  .item-image-thumb:hover {
    transform: scale(1.05);
    border-color: var(--primary);
    box-shadow: var(--shadow-md);
  }

  .item-image-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .item-image-more {
    width: 50px;
    height: 50px;
    border-radius: var(--border-radius);
    background: var(--bg-2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--fg-2);
    border: 1px solid var(--bg-3);
  }

  .item-feedback-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--fg-2);
  }

  .feedback-icon {
    font-size: 0.875rem;
    line-height: 1;
  }

  .feedback-count {
    font-weight: 600;
  }

  /* Dark mode adjustments */
  :global(html.dark) .item {
    background: rgba(39, 45, 69, 0.6);
    border-color: rgba(76, 76, 76, 0.5);
  }

  :global(html.dark) .item:not(.read-only):hover {
    background: rgba(39, 45, 69, 0.8);
    border-color: var(--primary);
  }
</style>

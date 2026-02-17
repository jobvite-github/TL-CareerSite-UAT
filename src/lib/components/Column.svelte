<script lang="ts">
  import type { Column, Task, ColumnId } from '$lib/types';
  import TaskCard from './TaskCard.svelte';

  let {
    column,
    isAdmin = false,
    isDragOver = false,
    draggedItemId = null,
    variant = 'default',
    onDrop,
    onDragOver,
    onDragLeave,
    onItemDragStart,
    onItemClick,
    onToggleLock
  }: {
    column: Column;
    isAdmin?: boolean;
    isDragOver?: boolean;
    draggedItemId?: number | null;
    variant?: 'default' | 'alert' | 'warning' | 'info' | 'success' | 'subtle';
    onDrop: (e: DragEvent, columnId: ColumnId) => void;
    onDragOver: (e: DragEvent, columnId: ColumnId) => void;
    onDragLeave: () => void;
    onItemDragStart: (e: DragEvent, item: Task, columnId: ColumnId) => void;
    onItemClick: (item: Task, columnId: ColumnId) => void;
    onToggleLock: (itemId: number) => void;
  } = $props();
  
  // Separate drag and drop restrictions for non-admins
  // In Progress: can't drag from OR drop to
  // Re-Test: can drag from, but can't drop to
  const isDragDisabled = $derived(!isAdmin && (column.id === 'inprogress' || column.id === 'cancelled'));
  const isDropDisabled = $derived(!isAdmin && (column.id === 'inprogress' || column.id === 'cancelled' || column.id === 'retest' || column.id === 'feedback'));
</script>

<div 
  class="column"
  class:drag-over={isDragOver && !isDropDisabled}
  class:drop-disabled={isDropDisabled}
  class:alert={variant === 'alert'}
  class:warning={variant === 'warning'}
  class:info={variant === 'info'}
  class:success={variant === 'success'}
  class:subtle={variant === 'subtle'}
  role="region"
  aria-label="{column.title} column"
  ondrop={(e) => !isDropDisabled && onDrop(e, column.id)}
  ondragover={(e) => !isDropDisabled && onDragOver(e, column.id)}
  ondragleave={onDragLeave}
>
  <h2>
    <span>
      {#if variant === 'alert'}
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      {/if}
      {#if variant === 'warning'}
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      {/if}
      {#if variant === 'info'}
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        </svg>
      {/if}
      {#if variant === 'success'}
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      {/if}
      {#if variant === 'subtle'}
        {#if column.id === 'cancelled'}
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        {:else}
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        {/if}
      {/if}
      {column.title}
      <span class="count">({column.items.length})</span>
    </span>
    {#if isDropDisabled || isDragDisabled}
      <span class="admin-only" title="Cannot {isDropDisabled ? `${isDragDisabled ? 'drag or ' : ''}drop to` : 'drag from'} this column">🔒</span>
    {/if}
  </h2>
  <div class="items" role="list" aria-label="{column.title} tasks">
    {#if column.items.length === 0}
      <div class="empty-state">
        <p>No tasks here</p>
      </div>
    {:else}
      {#each column.items as item (item.id)}
        <TaskCard
          {item}
          columnId={column.id}
          {isAdmin}
          isDragging={draggedItemId === item.id}
          isReadOnly={isDragDisabled}
          onDragStart={onItemDragStart}
          onClick={onItemClick}
          onToggleLock={onToggleLock}
        />
      {/each}
    {/if}
  </div>
</div>

<style>
  .column {
    background: var(--bg-2);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    min-height: 400px;
    transition: all 0.2s;
    border: 1px solid var(--bg-3);
    box-shadow: var(--shadow-sm);
  }

  .column.alert,
  .column.warning,
  .column.info,
  .column.success {
    min-height: auto;
  }

  .column.subtle {
    min-height: auto;
  }

  .column.drag-over {
    background: var(--primary-light);
    border: 2px dashed var(--primary);
    box-shadow: var(--shadow-md);
  }

  .column h2 {
    margin: 0 0 1rem 0;
    color: var(--fg-1);
    font-size: 1.125rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    letter-spacing: -0.025em;
  }
  
  .column h2 span {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .column h2 .icon {
    width: 1.2rem;
    height: 1.2rem;
    flex-shrink: 0;
  }

  .column.alert {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 2px solid var(--error);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
  }

  .column.alert h2 {
    color: #991b1b;
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .column.alert h2 .count,
  .column.alert h2 .admin-only {
    color: #7f1d1d;
  }

  .column.warning {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 2px solid var(--warning);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
  }

  .column.warning h2 {
    color: #92400e;
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .column.warning h2 .count,
  .column.warning h2 .admin-only {
    color: #78350f;
  }

  .column.info {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border: 2px solid var(--primary);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
  }

  .column.info h2 {
    color: #3730a3;
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .column.info h2 .count,
  .column.info h2 .admin-only {
    color: #312e81;
  }

  .column.success {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 2px solid var(--success);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  }

  .column.success h2 {
    color: #065f46;
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .column.success h2 .count,
  .column.success h2 .admin-only {
    color: #064e3b;
  }

  .column.subtle {
    background: var(--bg-1);
    border: 1px solid var(--bg-3);
    opacity: 0.7;
  }

  .column.subtle h2 {
    color: var(--fg-2);
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .count {
    font-size: 1rem;
    color: var(--fg-2);
    font-weight: normal;
  }
  
  .admin-only {
    font-size: 0.9rem;
    opacity: 0.7;
  }
  
  .column.drop-disabled {
    opacity: 0.85;
  }

  .items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--fg-2);
    font-style: italic;
  }

  .empty-state p {
    margin: 0;
  }

  /* Dark mode adjustments */
  :global(html.dark) .column {
    background: rgba(76, 76, 76, 0.5);
  }

  :global(html.dark) .column.alert {
    background: linear-gradient(135deg, rgba(255, 235, 238, 0.15) 0%, rgba(255, 205, 210, 0.15) 100%);
    border-color: rgba(244, 67, 54, 0.6);
  }

  :global(html.dark) .column.warning {
    background: linear-gradient(135deg, rgba(255, 243, 224, 0.15) 0%, rgba(255, 224, 178, 0.15) 100%);
    border-color: rgba(255, 152, 0, 0.6);
  }

  :global(html.dark) .column.info {
    background: linear-gradient(135deg, rgba(227, 242, 253, 0.15) 0%, rgba(187, 222, 251, 0.15) 100%);
    border-color: rgba(33, 150, 243, 0.6);
  }

  :global(html.dark) .column.success {
    background: linear-gradient(135deg, rgba(232, 245, 233, 0.15) 0%, rgba(200, 230, 201, 0.15) 100%);
    border-color: rgba(76, 175, 80, 0.6);
  }

  :global(html.dark) .column.subtle {
    background: rgba(76, 76, 76, 0.3);
    border-color: rgba(102, 102, 102, 0.5);
  }

  :global(html.dark) .column.alert h2,
  :global(html.dark) .column.alert h2 .count,
  :global(html.dark) .column.alert h2 .admin-only {
    color: #ffcdd2;
  }

  :global(html.dark) .column.warning h2,
  :global(html.dark) .column.warning h2 .count,
  :global(html.dark) .column.warning h2 .admin-only {
    color: #ffe0b2;
  }

  :global(html.dark) .column.info h2,
  :global(html.dark) .column.info h2 .count,
  :global(html.dark) .column.info h2 .admin-only {
    color: #bbdefb;
  }

  :global(html.dark) .column.success h2,
  :global(html.dark) .column.success h2 .count,
  :global(html.dark) .column.success h2 .admin-only {
    color: #c8e6c9;
  }
</style>

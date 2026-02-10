<script lang="ts">
  import type { Column, Task, ColumnId } from '$lib/types';
  import TaskCard from './TaskCard.svelte';

  let {
    column,
    isAdmin = false,
    isDragOver = false,
    draggedItemId = null,
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
  const isDragDisabled = $derived(!isAdmin && (column.id === 'inprogress' || column.id === 'done'));
  const isDropDisabled = $derived(!isAdmin && (column.id === 'inprogress' || column.id === 'retest'));
</script>

<div 
  class="column"
  class:drag-over={isDragOver && !isDropDisabled}
  class:drop-disabled={isDropDisabled}
  role="region"
  aria-label="{column.title} column"
  ondrop={(e) => !isDropDisabled && onDrop(e, column.id)}
  ondragover={(e) => !isDropDisabled && onDragOver(e, column.id)}
  ondragleave={onDragLeave}
>
  <h2>
    {column.title}
    {#if isDropDisabled || isDragDisabled}
      <span class="admin-only" title="Cannot {isDropDisabled ? `${isDragDisabled ? 'drag or ' : ''}drop to` : 'drag from'} this column">🔒</span>
    {/if}
    <span class="count">({column.items.length})</span>
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
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    min-height: 400px;
    transition: background 0.2s;
  }

  .column.drag-over {
    background: #e8f5e9;
    border: 2px dashed #4CAF50;
  }

  .column h2 {
    margin: 0 0 1rem 0;
    color: var(--fg-1);
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
</style>

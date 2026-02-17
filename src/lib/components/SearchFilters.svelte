<script lang="ts">
  import type { TaskType } from '$lib/types';
  import { TASK_TYPES } from '$lib/types';
  import ButtonComponent from './Button.svelte';

  let {
    searchQuery = $bindable<string>(''),
    filterType = $bindable<TaskType | 'All'>('All'),
    disableAddTask = false,
    isAdmin = false,
    onAddTask,
    onHelp
  }: {
    searchQuery: string;
    filterType: TaskType | 'All';
    disableAddTask?: boolean;
    isAdmin?: boolean;
    onAddTask: () => void;
    onHelp: () => void;
  } = $props();
</script>

<div class="header-controls">
  <div class="search-filters">
    <input 
      type="text" 
      class="search-input" 
      placeholder="Search tasks..." 
      bind:value={searchQuery}
    />
    <select class="filter-select" bind:value={filterType}>
      <option value="All">All Types</option>
      {#each TASK_TYPES as type}
        <option value={type}>{type}</option>
      {/each}
    </select>
  </div>

  <div class="action-buttons">
    <ButtonComponent 
      element="button"
      text="Help"
      title="View status guide"
      type="hollow-primary"
      size="small"
      onClick={onHelp}
    />
    {#if !disableAddTask || isAdmin}
       <ButtonComponent 
         element="button"
         text="+ Add Task"
         title='Add a new task'
         type="primary"
         size="small"
         disabled={disableAddTask}
         onClick={onAddTask}
       />
    {/if}
  </div>
</div>

<style>
  .header-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .search-filters {
    display: flex;
    gap: 1rem;
    flex: 1;
  }

  .search-input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid var(--bg-3);
    border-radius: var(--border-radius);
    font-size: 1rem;
    background: var(--bg-2);
    color: var(--fg-1);
    box-sizing: border-box;
    transition: all 0.2s;
    box-shadow: var(--shadow-sm);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .filter-select {
    padding: 0.75rem;
    border: 1px solid var(--bg-3);
    border-radius: var(--border-radius);
    font-size: 1rem;
    background: var(--bg-2);
    color: var(--fg-1);
    box-sizing: border-box;
    cursor: pointer;
    min-width: 150px;
    transition: all 0.2s;
    box-shadow: var(--shadow-sm);
  }

  .filter-select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .action-buttons {
    display: flex;
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    .header-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .search-filters {
      flex-direction: column;
    }

    .filter-select {
      min-width: unset;
      width: 100%;
    }

    .action-buttons {
      width: 100%;
    }
  }
</style>

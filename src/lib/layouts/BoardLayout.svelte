<script lang="ts">
  import type { Column, Task, ModalData, Toast, TaskType, ColumnId } from '$lib/types';
  import { Octokit } from 'octokit';

  // GitHub Configuration from environment variables
  const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'your-github-username';
  const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'uat-app';
  const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || 'your-github-token';
  const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main';
  
  const STORAGE_VERSION = '1.0';

  // Initialize Octokit
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  // Customer and authentication state
  let customerId = $state('');
  let isAuthenticated = $state(false);
  let passwordInput = $state('');
  let passwordError = $state('');
  let isLoading = $state(false);
  let fileSha = $state<string | null>(null); // Needed for updating files on GitHub

  // Get customer ID from URL hash
  $effect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1); // Remove the #
      if (hash) {
        customerId = hash;
      } else {
        customerId = 'demo'; // Default for testing
      }
    }
  });

  // Simple password hashing function (SHA-256)
  async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const STORAGE_KEY = 'uat-board-data';

  // Focus trap action
  function trapFocus(node: HTMLElement) {
    const previouslyFocused = document.activeElement as HTMLElement;

    function focusable() {
      return Array.from(
        node.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;

      const current = document.activeElement;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const elements = focusable();
    if (elements.length > 0) {
      elements[0].focus();
    }

    node.addEventListener('keydown', handleKeydown);

    return () => {
      node.removeEventListener('keydown', handleKeydown);
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }

  // Initialize columns with data from localStorage or defaults
  function initializeColumns(): Column[] {
    // Start with empty columns when not authenticated
    return getDefaultColumns();
  }

  function getDefaultColumns(): Column[] {
    return [
      { id: 'todo', title: 'To Do', items: [] },
      { id: 'inprogress', title: 'In Progress', items: [] },
      { id: 'done', title: 'Done', items: [] }
    ];
  }

  // GitHub API functions
  async function loadDataFromGitHub(password: string): Promise<boolean> {
    isLoading = true;
    passwordError = '';
    
    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: `data/${customerId}.json`,
        ref: GITHUB_BRANCH
      });

      if (Array.isArray(fileData) || !('content' in fileData)) {
        throw new Error('Unexpected response format');
      }

      fileSha = fileData.sha; // Store SHA for updates
      
      // Decode base64 content
      const content = JSON.parse(atob(fileData.content));
      
      // Verify password
      const inputHash = await hashPassword(password);
      if (content.passwordHash !== inputHash) {
        passwordError = 'Incorrect password';
        return false;
      }

      // Load columns
      if (content.version === STORAGE_VERSION && content.columns) {
        columns = content.columns;
        isAuthenticated = true;
        showToast('Data loaded successfully', 'success');
        return true;
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error: any) {
      // Handle 404 - file doesn't exist, create new customer
      if (error.status === 404) {
        const passwordHash = await hashPassword(password);
        const newData = {
          passwordHash,
          version: STORAGE_VERSION,
          columns: getDefaultColumns()
        };
        
        const created = await saveDataToGitHub(newData, 'Initial customer data');
        if (created) {
          columns = getDefaultColumns();
          isAuthenticated = true;
          showToast('Welcome! New customer board created.', 'success');
        }
        return created;
      }
      
      console.error('Failed to load data:', error);
      passwordError = 'Failed to load data. Check configuration.';
      return false;
    } finally {
      isLoading = false;
    }
  }

  async function saveDataToGitHub(data: any, message: string = 'Update board data'): Promise<boolean> {
    try {
      const params: any = {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: `data/${customerId}.json`,
        message,
        content: btoa(JSON.stringify(data, null, 2)),
        branch: GITHUB_BRANCH
      };

      if (fileSha) {
        params.sha = fileSha; // Required for updates
      }

      const { data: result } = await octokit.rest.repos.createOrUpdateFileContents(params);
      fileSha = result.content?.sha || null; // Update SHA for next save
      return true;
    } catch (error) {
      console.error('Failed to save data:', error);
      showToast('Failed to save data to GitHub', 'error');
      return false;
    }
  }

  async function handlePasswordSubmit() {
    if (!passwordInput.trim()) {
      passwordError = 'Please enter a password';
      return;
    }
    await loadDataFromGitHub(passwordInput);
  }

  let columns = $state<Column[]>(initializeColumns());
  let draggedItem = $state<Task | null>(null);
  let draggedFromColumn = $state<ColumnId | null>(null);
  let dragOverColumn = $state<ColumnId | null>(null);
  
  // Modal state
  let showModal = $state(false);
  let selectedItem = $state<Task | null>(null);
  let selectedColumnId = $state<ColumnId>('todo');
  let originalColumnId = $state<ColumnId | null>(null);
  let isNewItem = $state(false);
  let modalData = $state<ModalData>({
    description: '',
    type: 'Change Request',
    feedback: '',
    section: ''
  });

  // Search and filter state
  let searchQuery = $state('');
  let filterType = $state<TaskType | 'All'>('All');
  let filterTag = $state<string>('All');

  // Toast notifications
  let toasts = $state<Toast[]>([]);
  let toastId = 0;

  // Delete confirmation
  let showDeleteConfirm = $state(false);
  let deleteTarget = $state<{ columnId: ColumnId; itemId: number } | null>(null);

  // Export/Import
  let showExportImport = $state(false);
  let importError = $state('');

  // Validation errors
  let validationError = $state('');

  // Track original data for unsaved changes detection
  let originalModalData = $state<ModalData | null>(null);
  let showUnsavedChanges = $state(false);

  // Save to GitHub whenever columns change (debounced)
  let saveTimeout: number | null = null;
  $effect(() => {
    if (isAuthenticated && columns) {
      // Debounce saves to avoid too many API calls
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = window.setTimeout(async () => {
        const data = {
          passwordHash: await hashPassword(passwordInput), // Keep existing password
          version: STORAGE_VERSION,
          columns: columns
        };
        await saveDataToGitHub(data, 'Auto-save board changes');
      }, 1000); // Wait 1 second after last change
    }
  });

  // Computed filtered columns
  function getFilteredColumns(): Column[] {
    return columns.map(col => ({
      ...col,
      items: col.items.filter(item => {
        const matchesSearch = searchQuery === '' || 
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.feedback.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesType = filterType === 'All' || item.type === filterType;
        
        return matchesSearch && matchesType;
      })
    }));
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = toastId++;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 3000);
  }

  function handleDragStart(event: DragEvent, item: Task, columnId: ColumnId) {
    draggedItem = item;
    draggedFromColumn = columnId;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(event: DragEvent, columnId: ColumnId) {
    event.preventDefault();
    dragOverColumn = columnId;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDragLeave() {
    dragOverColumn = null;
  }

  function handleDrop(event: DragEvent, targetColumnId: ColumnId) {
    event.preventDefault();
    dragOverColumn = null;
    
    if (draggedItem && draggedFromColumn && draggedFromColumn !== targetColumnId) {
      const updatedItem = { ...draggedItem, updatedAt: new Date().toISOString() };
      
      // Remove from source column
      columns = columns.map(col => {
        if (col.id === draggedFromColumn) {
          return {
            ...col,
            items: col.items.filter(item => item.id !== draggedItem!.id)
          };
        }
        return col;
      });

      // Add to target column
      columns = columns.map(col => {
        if (col.id === targetColumnId) {
          return {
            ...col,
            items: [...col.items, updatedItem]
          };
        }
        return col;
      });

      showToast(`Moved "${draggedItem.description}" to ${columns.find(c => c.id === targetColumnId)?.title}`, 'success');
    }

    draggedItem = null;
    draggedFromColumn = null;
  }

  function openNewItemModal() {
    isNewItem = true;
    selectedItem = null;
    selectedColumnId = 'todo';
    modalData = {
      description: '',
      type: 'Change Request',
      feedback: '',
      section: ''
    };
    originalModalData = { ...modalData };
    validationError = '';
    showModal = true;
  }

  function confirmDelete(columnId: ColumnId, itemId: number) {
    deleteTarget = { columnId, itemId };
    showDeleteConfirm = true;
  }

  function deleteItem() {
    if (!deleteTarget) return;
    
    const { columnId, itemId } = deleteTarget;
    const item = columns.find(c => c.id === columnId)?.items.find(i => i.id === itemId);
    
    columns = columns.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          items: col.items.filter(item => item.id !== itemId)
        };
      }
      return col;
    });
    
    showDeleteConfirm = false;
    deleteTarget = null;
    showToast(`Deleted "${item?.description || 'task'}"`, 'info');
  }

  function cancelDelete() {
    showDeleteConfirm = false;
    deleteTarget = null;
  }

  function openModal(item: Task, columnId: ColumnId) {
    isNewItem = false;
    selectedItem = item;
    selectedColumnId = columnId;
    originalColumnId = columnId;
    modalData = {
      description: item.description || '',
      type: item.type || 'Change Request',
      feedback: item.feedback || '',
      section: item.section || ''
    };
    originalModalData = { ...modalData };
    validationError = '';
    showModal = true;
  }

  function hasUnsavedChanges(): boolean {
    if (!originalModalData) return false;
    return (
      modalData.description !== originalModalData.description ||
      modalData.type !== originalModalData.type ||
      modalData.feedback !== originalModalData.feedback ||
      modalData.section !== originalModalData.section
    );
  }

  function attemptCloseModal() {
    if (hasUnsavedChanges()) {
      showUnsavedChanges = true;
    } else {
      closeModal();
    }
  }

  function closeModal() {
    showModal = false;
    selectedItem = null;
    isNewItem = false;
    validationError = '';
    originalModalData = null;
    originalColumnId = null;
    showUnsavedChanges = false;
  }

  function discardChanges() {
    showUnsavedChanges = false;
    closeModal();
  }

  function saveAndClose() {
    showUnsavedChanges = false;
    saveModal();
  }

  function validateModal(): boolean {
    const trimmedDescription = modalData.description.trim();
    
    if (!trimmedDescription) {
      validationError = 'Description is required';
      return false;
    }
    
    if (trimmedDescription.length > 500) {
      validationError = 'Description must be less than 500 characters';
      return false;
    }
    
    validationError = '';
    return true;
  }

  function saveModal() {
    if (!validateModal()) return;

    const now = new Date().toISOString();
    
    if (isNewItem) {
      // Create new item
      const newItem: Task = {
        id: Date.now(),
        description: modalData.description.trim(),
        type: modalData.type,
        feedback: modalData.feedback.trim(),
        section: modalData.section.trim(),
        createdAt: now,
        updatedAt: now
      };

      columns = columns.map(col => {
        if (col.id === selectedColumnId) {
          return {
            ...col,
            items: [...col.items, newItem]
          };
        }
        return col;
      });
      
      showToast(`Created "${newItem.description}"`, 'success');
    } else if (selectedItem && selectedColumnId) {
      // Update existing item
      const updatedItem = {
        ...selectedItem,
        description: modalData.description.trim(),
        type: modalData.type,
        feedback: modalData.feedback.trim(),
        section: modalData.section.trim(),
        updatedAt: now
      };

      // Check if item is being moved to a different column
      if (originalColumnId && originalColumnId !== selectedColumnId) {
        // Remove from original column and add to new column
        columns = columns.map(col => {
          if (col.id === originalColumnId) {
            return {
              ...col,
              items: col.items.filter(item => item.id !== selectedItem!.id)
            };
          } else if (col.id === selectedColumnId) {
            return {
              ...col,
              items: [...col.items, updatedItem]
            };
          }
          return col;
        });
        const newColumnName = columns.find(c => c.id === selectedColumnId)?.title;
        showToast(`Moved "${modalData.description}" to ${newColumnName}`, 'success');
      } else {
        // Update in same column
        columns = columns.map(col => {
          if (col.id === selectedColumnId) {
            return {
              ...col,
              items: col.items.map(item => {
                if (item.id === selectedItem!.id) {
                  return updatedItem;
                }
                return item;
              })
            };
          }
          return col;
        });
        showToast(`Updated "${modalData.description}"`, 'success');
      }
    }
    closeModal();
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      attemptCloseModal();
    }
  }

  function exportData() {
    const dataStr = JSON.stringify({ version: STORAGE_VERSION, columns }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uat-board-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Board data exported successfully', 'success');
    showExportImport = false;
  }

  async function copyToClipboard() {
    try {
      const dataStr = JSON.stringify({ version: STORAGE_VERSION, columns }, null, 2);
      await navigator.clipboard.writeText(dataStr);
      showToast('JSON copied to clipboard!', 'success');
      showExportImport = false;
    } catch (err) {
      showToast('Failed to copy to clipboard', 'error');
    }
  }

  function handleImportFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.version && data.columns) {
          columns = data.columns;
          showToast('Board data imported successfully', 'success');
          showExportImport = false;
          importError = '';
        } else {
          importError = 'Invalid file format';
        }
      } catch (err) {
        importError = 'Failed to parse file';
      }
    };
    reader.readAsText(file);
  }

  function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      columns = getDefaultColumns();
      showToast('All data cleared', 'info');
      showExportImport = false;
    }
  }
</script>

<!-- Toast Notifications -->
{#if toasts.length > 0}
  <div class="toast-container">
    {#each toasts as toast (toast.id)}
      <div class="toast toast-{toast.type}">
        {toast.message}
      </div>
    {/each}
  </div>
{/if}

<!-- Password Login Screen -->
{#if !isAuthenticated}
  <div class="login-container">
    <div class="login-box">
      <h1>UAT Board</h1>
      <p class="customer-id">Customer: <strong>{customerId}</strong></p>
      
      <form onsubmit={(e) => { e.preventDefault(); handlePasswordSubmit(); }}>
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password"
            bind:value={passwordInput}
            placeholder="Enter your password"
            disabled={isLoading}
          />
          {#if passwordError}
            <div class="error-message">{passwordError}</div>
          {/if}
        </div>
        
        <button type="submit" class="login-btn" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Access Board'}
        </button>
      </form>
      
      <p class="login-hint">
        First time? Enter a password to create your board.
      </p>
    </div>
  </div>
{:else}
  <!-- Main Application -->
  <div class="container">
  <!-- Header with filters and controls -->
  <div class="header-controls">
    <div class="search-filters">
      <input 
        type="text" 
        class="search-input" 
        placeholder="Search tasks..." 
        bind:value={searchQuery}
      />
    </div>

    <div class="action-buttons">
      <button class="add-task-btn" onclick={openNewItemModal}>+ Add Task</button>
      <button class="export-btn" onclick={() => showExportImport = true}>⚙️ Data</button>
    </div>
  </div>

  <div class="columns" role="group" aria-label="Task board columns">
    {#each getFilteredColumns() as column}
      <div 
        class="column"
        class:drag-over={dragOverColumn === column.id}
        role="region"
        aria-label="{column.title} column"
        ondrop={(e) => handleDrop(e, column.id)}
        ondragover={(e) => handleDragOver(e, column.id)}
        ondragleave={handleDragLeave}
      >
        <h2>{column.title} <span class="count">({column.items.length})</span></h2>
        <div class="items" role="list" aria-label="{column.title} tasks">
          {#if column.items.length === 0}
            <div class="empty-state">
              <p>No tasks here</p>
            </div>
          {:else}
            {#each column.items as item (item.id)}
              <div 
                class="item"
                class:being-dragged={draggedItem?.id === item.id}
                role="button"
                draggable="true"
                tabindex="0"
                aria-label="Task: {item.description}. Type: {item.type}. Click to edit, drag to move."
                ondragstart={(e) => handleDragStart(e, item, column.id)}
                onclick={() => openModal(item, column.id)}
                onkeydown={(e) => {
                  if (e.code === 'Enter' || e.code === 'Space') {
                    e.preventDefault();
                    openModal(item, column.id);
                  }
                }}
              >
                <div class="item-content">
                  <div class="item-header">
                    <span class="item-type">{item.type}</span>
                  </div>
                  <p class="item-description">{item.description}</p>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<!-- Task Modal -->
{#if showModal}
  <div 
    class="modal-overlay" 
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
    onclick={handleOverlayClick}
    onkeydown={(e) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        attemptCloseModal();
      }
    }}
  >
    <div class="modal" {@attach trapFocus}>
      <div class="modal-header">
        <h2 id="modal-title">{isNewItem ? 'Add Task' : 'Edit Task'}</h2>
        <button class="close-btn" aria-label="Close modal" onclick={attemptCloseModal}>×</button>
      </div>
      
      <div class="modal-body">
        {#if validationError}
          <div class="error-message">{validationError}</div>
        {/if}

        <div class="form-group">
          <label for="status">Status</label>
          <select id="status" bind:value={selectedColumnId}>
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div class="form-group">
          <label for="description">Description *</label>
          <textarea 
            id="description"
            bind:value={modalData.description}
            rows="4"
            maxlength="500"
            placeholder="Enter task description..."
          ></textarea>
          <small>{modalData.description.length}/500 characters</small>
        </div>

        <div class="form-group">
          <label for="section">Section / Page</label>
          <input 
            type="text" 
            id="section"
            bind:value={modalData.section}
            placeholder="e.g., Header, Home Page, Categories..."
          />
        </div>

        <div class="form-group">
          <label for="feedback">Feedback / Notes</label>
          <textarea 
            id="feedback"
            bind:value={modalData.feedback}
            rows="3"
            placeholder="Enter feedback or additional notes..."
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <div class="modal-footer-left">
          {#if !isNewItem}
            <button 
              class="delete-btn-modal" 
              onclick={() => confirmDelete(selectedColumnId, selectedItem!.id)}
            >
              Delete Task
            </button>
          {/if}
        </div>
        <div class="modal-footer-right">
          <button class="cancel-btn" onclick={attemptCloseModal}>Cancel</button>
          <button class="save-btn" onclick={saveModal}>
            {isNewItem ? 'Add Task' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Unsaved Changes Confirmation Modal -->
{#if showUnsavedChanges}
  <div 
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(e) => e.target === e.currentTarget && (showUnsavedChanges = false)}
    onkeydown={(e) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        showUnsavedChanges = false;
      }
    }}
  >
    <div class="modal modal-small" {@attach trapFocus}>
      <div class="modal-header">
        <h2>Unsaved Changes</h2>
      </div>
      <div class="modal-body">
        <p>You have unsaved changes. What would you like to do?</p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" onclick={() => showUnsavedChanges = false}>Keep Editing</button>
        <button class="delete-confirm-btn" onclick={discardChanges}>Discard</button>
        <button class="save-btn" onclick={saveAndClose}>Save</button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
  <div 
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(e) => e.target === e.currentTarget && cancelDelete()}
    onkeydown={(e) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        cancelDelete();
      }
    }}
  >
    <div class="modal modal-small" {@attach trapFocus}>
      <div class="modal-header">
        <h2>Confirm Delete</h2>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to delete this task? This action cannot be undone.</p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" onclick={cancelDelete}>Cancel</button>
        <button class="delete-confirm-btn" onclick={deleteItem}>Delete</button>
      </div>
    </div>
  </div>
{/if}

<!-- Export/Import Modal -->
{#if showExportImport}
  <div 
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(e) => e.target === e.currentTarget && (showExportImport = false)}
    onkeydown={(e) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        showExportImport = false;
      }
    }}
  >
    <div class="modal modal-small" {@attach trapFocus}>
      <div class="modal-header">
        <h2>Data Management</h2>
        <button class="close-btn" onclick={() => showExportImport = false}>×</button>
      </div>
      <div class="modal-body">
        {#if importError}
          <div class="error-message">{importError}</div>
        {/if}
        
        <div class="data-actions">
          <button class="action-btn" onclick={copyToClipboard}>
            📋 Copy JSON
          </button>
          
          <button class="action-btn" onclick={exportData}>
            📥 Export Board Data
          </button>
          
          <label class="action-btn file-input-label">
            📤 Import Board Data
            <input 
              type="file" 
              accept=".json"
              onchange={handleImportFile}
              style="display: none;"
            />
          </label>
          
          <button class="action-btn danger" onclick={clearAllData}>
            🗑️ Clear All Data
          </button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" onclick={() => showExportImport = false}>Close</button>
      </div>
    </div>
  </div>
{/if}
{/if}

<style>
  /* Login Styles */
  .login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--bg-1);
    padding: 2rem;
  }

  .login-box {
    background: var(--bg-2);
    padding: 3rem;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    max-width: 400px;
    width: 100%;
  }

  .login-box h1 {
    margin: 0 0 0.5rem 0;
    color: var(--fg-1);
    text-align: center;
  }

  .customer-id {
    text-align: center;
    color: var(--fg-3);
    margin-bottom: 2rem;
    font-size: 0.9rem;
  }

  .customer-id strong {
    color: var(--fg-1);
  }

  .login-btn {
    width: 100%;
    padding: 0.75rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: background 0.2s;
  }

  .login-btn:hover:not(:disabled) {
    background: #45a049;
  }

  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .login-hint {
    text-align: center;
    color: var(--fg-3);
    font-size: 0.85rem;
    margin-top: 1.5rem;
    margin-bottom: 0;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  /* Header Controls */
  .header-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .search-filters {
    display: flex;
    gap: 1rem;
    flex: 1;
    min-width: 300px;
  }

  .search-input {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid var(--bg-3);
    border-radius: 4px;
    font-size: 1rem;
    background: var(--bg-1);
    color: var(--fg-1);
  }

  .search-input:focus {
    outline: none;
    border-color: #4CAF50;
  }

  .filter-select {
    padding: 0.75rem;
    border: 2px solid var(--bg-3);
    border-radius: 4px;
    font-size: 1rem;
    background: var(--bg-1);
    color: var(--fg-1);
    cursor: pointer;
  }

  .action-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .add-task-btn {
    padding: 0.75rem 1.5rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: background 0.2s;
  }

  .add-task-btn:hover {
    background: #45a049;
  }

  .export-btn {
    padding: 0.75rem 1.5rem;
    background: var(--bg-3);
    color: var(--fg-1);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: background 0.2s;
  }

  .export-btn:hover {
    background: var(--bg-2);
  }

  /* Columns */
  .columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .column {
    background: var(--bg-2);
    border-radius: 8px;
    padding: 1rem;
    min-height: 400px;
    transition: background 0.2s;
  }

  .column.drag-over {
    background: var(--bg-3);
    box-shadow: 0 0 0 3px #4CAF50;
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
    font-size: 0.9rem;
    color: var(--fg-3);
    font-weight: normal;
  }

  .items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--fg-3);
  }

  .empty-state p {
    margin: 0;
    font-style: italic;
  }

  /* Item Cards */
  .item {
    background: var(--bg-1);
    padding: 1rem;
    border-radius: 6px;
    cursor: move;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
    border: 2px solid transparent;
  }

  .item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    border-color: var(--bg-3);
  }

  .item:focus {
    outline: none;
    border-color: #4CAF50;
  }

  .item.being-dragged {
    opacity: 0.5;
  }

  .item-content {
    flex: 1;
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .item-type {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: var(--bg-3);
    border-radius: 3px;
    font-weight: 600;
    color: var(--fg-2);
  }

  .item-due {
    font-size: 0.75rem;
    color: var(--fg-3);
  }

  .item-description {
    margin: 0;
    word-break: break-word;
    line-height: 1.5;
  }

  .item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.5rem;
  }

  .tag {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    background: #4CAF50;
    color: white;
    border-radius: 12px;
    font-weight: 500;
  }

  .delete-btn {
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s;
  }

  .delete-btn:hover {
    background: #cc0000;
  }

  /* Toast Notifications */
  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .toast {
    padding: 1rem 1.5rem;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
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

  .toast-success {
    background: #4CAF50;
  }

  .toast-error {
    background: #f44336;
  }

  .toast-info {
    background: #2196F3;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal {
    background: var(--bg-1);
    color: var(--fg-1);
    border-radius: 8px;
    width: 90%;
    max-width: 650px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-small {
    max-width: 450px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--bg-3);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    color: var(--fg-3);
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: var(--fg-1);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
  }

  .error-message {
    padding: 0.75rem;
    background: #ffebee;
    color: #c62828;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--fg-1);
    font-weight: 600;
  }

  .form-group small {
    display: block;
    margin-top: 0.25rem;
    color: var(--fg-3);
    font-size: 0.85rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--bg-3);
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
    box-sizing: border-box;
    background: var(--bg-1);
    color: var(--fg-1);
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #4CAF50;
  }

  .form-group textarea {
    resize: vertical;
  }

  /* Tag Selector */
  .tag-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag-option {
    padding: 0.5rem 1rem;
    border: 2px solid var(--bg-3);
    background: var(--bg-1);
    color: var(--fg-1);
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .tag-option:hover {
    border-color: #4CAF50;
  }

  .tag-option.selected {
    background: #4CAF50;
    color: white;
    border-color: #4CAF50;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid var(--bg-3);
  }

  .modal-footer-left {
    flex: 1;
  }

  .modal-footer-right {
    display: flex;
    gap: 1rem;
  }

  .cancel-btn,
  .save-btn,
  .delete-confirm-btn,
  .delete-btn-modal {
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
    background: var(--bg-2);
  }

  .save-btn {
    background: #4CAF50;
    color: white;
  }

  .save-btn:hover {
    background: #45a049;
  }

  .delete-confirm-btn,
  .delete-btn-modal {
    background: #f44336;
    color: white;
  }

  .delete-confirm-btn:hover,
  .delete-btn-modal:hover {
    background: #d32f2f;
  }

  /* Data Management */
  .data-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .action-btn {
    padding: 1rem;
    border: 2px solid var(--bg-3);
    background: var(--bg-2);
    color: var(--fg-1);
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    text-align: left;
    transition: all 0.2s;
  }

  .action-btn:hover {
    border-color: #4CAF50;
    background: var(--bg-3);
  }

  .action-btn.danger:hover {
    border-color: #f44336;
    background: #ffebee;
    color: #c62828;
  }

  .file-input-label {
    display: block;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .search-filters {
      flex-direction: column;
    }

    .columns {
      grid-template-columns: 1fr;
    }

    .modal {
      width: 95%;
    }
  }
</style>
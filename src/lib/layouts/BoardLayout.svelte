<script lang="ts">
  import type { Column, Task, ModalData, Toast, TaskType, ColumnId, BoardData } from '$lib/types';
  import { Octokit } from 'octokit';
  import { hashPassword, listAllDataFromGitHub, loadDataFromGitHub, loadDataFromGitHubAdmin, saveDataToGitHub, deleteDataFromGitHub, getDefaultColumns, STORAGE_VERSION } from '$lib/utils';
  import type { GitHubConfig } from '$lib/utils';
  import logo from '$lib/assets/employ_logo.svg';
  
  // Components
  import ToastComponent from '$lib/components/Toast.svelte';
  import ButtonComponent from '$lib/components/Button.svelte';
  import Login from '$lib/components/Login.svelte';
  import AdminList from '$lib/components/AdminList.svelte';
  import Board from '$lib/components/Board.svelte';
  import TaskModal from '$lib/components/TaskModal.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import HelpModal from '$lib/components/HelpModal.svelte';

  // GitHub Configuration from environment variables
  const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'your-github-username';
  const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'uat-app';
  const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || 'your-github-token';
  const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'data';
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'password-for-admin-login';

  // Initialize Octokit
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const githubConfig: GitHubConfig = {
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    token: GITHUB_TOKEN,
    branch: GITHUB_BRANCH
  };

  // Customer and authentication state
  let customerId = $state('');
  let isAuthenticated = $state(false);
  let isAdmin = $state(false);
  let usernameInput = $state('');
  let passwordInput = $state('');
  let passwordError = $state('');
  let isLoading = $state(false);
  let isSaving = $state(false);
  let hasPendingSave = $state(false);
  let fileSha = $state<string | null>(null);
  let storedPasswordHash = $state<string>(''); // Store original password hash
  let displayName = $state<string>('');
  let uatEndDate = $state<string>('');
  let devSiteUrl = $state<string>('');
  
  // Admin mode
  let isAdminMode = $state(false);
  let isAdminAuthenticated = $state(false);
  let adminPasswordInput = $state('');
  let adminPasswordError = $state('');
  let adminCustomers = $state<Array<{ name: string; path: string }>>([]);

  // Session storage helpers
  function getSessionKey(id: string): string {
    return `uat-session-${id}`;
  }

  function saveSession(id: string, isAdminUser: boolean) {
    const sessionData = {
      customerId: id,
      isAdmin: isAdminUser,
      timestamp: Date.now()
    };
    sessionStorage.setItem(getSessionKey(id), JSON.stringify(sessionData));
  }

  function loadSession(id: string): { customerId: string; isAdmin: boolean } | null {
    const data = sessionStorage.getItem(getSessionKey(id));
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  function clearSession(id: string) {
    sessionStorage.removeItem(getSessionKey(id));
  }

  // Load data with session restore
  async function loadCustomerWithSession(id: string) {
    isLoading = true;
    const result = await loadDataFromGitHubAdmin(octokit, githubConfig, id);
    
    if (result.success && result.data) {
      columns = result.data;
      isAuthenticated = true;
      
      if (result.sha) {
        fileSha = result.sha;
      }
      
      if (result.passwordHash) {
        storedPasswordHash = result.passwordHash;
      }
      
      disableAddTask = result.disableAddTask || false;
      displayName = result.displayName || '';
      uatEndDate = result.uatEndDate || '';
      devSiteUrl = result.devSiteUrl || '';
    }
    
    isLoading = false;
  }

  // Track previous context to clear session on switch
  let previousContext = $state<string>('');
  let currentHash = $state<string>('');
  let currentPathname = $state<string>('');

  // Listen for URL changes
  $effect(() => {
    if (typeof window !== 'undefined') {
      currentHash = window.location.hash.slice(1);
      currentPathname = window.location.pathname;

      const handleHashChange = () => {
        currentHash = window.location.hash.slice(1);
      };

      window.addEventListener('hashchange', handleHashChange);
      
      return () => {
        window.removeEventListener('hashchange', handleHashChange);
      };
    }
  });

  // Get customer ID from URL hash and detect admin mode
  $effect(() => {
    if (typeof window !== 'undefined') {
      // Check pathname first for admin mode
      const pathSegments = currentPathname.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1] || '';
      const isAdminPath = lastSegment === 'admin' || lastSegment === 'admin.html';
      
      // Determine current context
      const currentContext = (isAdminPath || currentHash === 'admin') ? 'admin' : currentHash;
      
      // Clear previous session if context changed
      if (previousContext && previousContext !== currentContext) {
        clearSession(previousContext);
        // Reset authentication state when switching
        isAuthenticated = false;
        isAdminAuthenticated = false;
        isAdminMode = false;
        passwordInput = '';
        adminPasswordInput = '';
        passwordError = '';
        adminPasswordError = '';
      }
      
      previousContext = currentContext;
      
      if (isAdminPath || currentHash === 'admin') {
        isAdminMode = true;
        
        // Check for existing admin session
        const session = loadSession('admin');
        if (session && session.customerId === 'admin') {
          isAdminAuthenticated = true;
          loadAdminCustomers();
        }
      } else if (currentHash) {
        customerId = currentHash;
        usernameInput = currentHash; // Auto-populate username
        
        // Check for existing customer session
        const session = loadSession(currentHash);
        if (session && session.customerId === currentHash) {
          isAdmin = session.isAdmin;
          loadCustomerWithSession(currentHash);
        }
      } else {
        customerId = usernameInput;
      }
    }
  });

  // Board data
  let columns = $state<Column[]>(getDefaultColumns());
  let draggedItem = $state<Task | null>(null);
  let draggedFromColumn = $state<ColumnId | null>(null);
  let dragOverColumn = $state<ColumnId | null>(null);
  let disableAddTask = $state(false);
  
  // Modal state
  let showModal = $state(false);
  let selectedItem = $state<Task | null>(null);
  let selectedColumnId = $state<ColumnId>('todo');
  let originalColumnId = $state<ColumnId | null>(null);
  let isNewItem = $state(false);
  let isModalViewOnly = $state(false);
  let modalData = $state<ModalData>({
    description: '',
    device: 'All',
    feedback: '',
    section: '',
    images: []
  });

  // Search and filter state
  let searchQuery = $state('');
  let filterType = $state<TaskType | 'All'>('All');

  // Toast notifications
  let toasts = $state<Toast[]>([]);
  let toastId = 0;

  // Confirmation modals
  let showDeleteConfirm = $state(false);
  let showUnsavedChanges = $state(false);
  let showHelpModal = $state(false);

  // Validation
  let validationError = $state('');

  // Track original data for unsaved changes
  let originalModalData = $state<ModalData | null>(null);

  // Verify admin password
  function handleAdminPasswordSubmit() {
    if (adminPasswordInput === ADMIN_PASSWORD) {
      isAdminAuthenticated = true;
      adminPasswordError = '';
      saveSession('admin', true); // Save admin session
      loadAdminCustomers();
    } else {
      adminPasswordError = 'Incorrect admin password';
    }
  }
  
  // Load customer list for admin mode
  async function loadAdminCustomers() {
    isLoading = true;
    const dataList = await listAllDataFromGitHub(octokit, githubConfig);
    if (dataList && Array.isArray(dataList)) {
      adminCustomers = dataList;
    } else {
      adminCustomers = [];
    }
    isLoading = false;
  }
  
  // Handle admin customer selection
  async function handleAdminSelectCustomer(selectedCustomerId: string) {
    isLoading = true;
    
    const result = await loadDataFromGitHubAdmin(octokit, githubConfig, selectedCustomerId);
    
    if (result.success && result.data) {
      columns = result.data;
      customerId = selectedCustomerId;
      usernameInput = selectedCustomerId;
      isAuthenticated = true;
      isAdmin = true; // Admin login
      isAdminMode = false;
      
      if (result.sha) {
        fileSha = result.sha;
      }
      
      // Store password hash to reuse on saves
      if (result.passwordHash) {
        storedPasswordHash = result.passwordHash;
      }
      
      // Load disableAddTask setting
      disableAddTask = result.disableAddTask || false;
      displayName = result.displayName || '';
      uatEndDate = result.uatEndDate || '';
      devSiteUrl = result.devSiteUrl || '';
      
      // Don't save a customer-specific session when admin selects them
      // The admin session is sufficient, and we don't want to give admin
      // privileges to direct customer logins
      
      showToast(`Loaded ${selectedCustomerId}'s board`, 'success');
    } else {
      showToast('Failed to load customer data', 'error');
    }
    
    isLoading = false;
  }
  
  // Handle admin customer creation
  async function handleAdminCreateCustomer(customerId: string, password: string, displayName: string, uatEndDate: string, devUrl: string) {
    isLoading = true;
    
    const boardData: BoardData = {
      displayName: displayName,
      uatEndDate: uatEndDate,
      devSiteUrl: devUrl,
      passwordHash: await hashPassword(password),
      version: STORAGE_VERSION,
      columns: getDefaultColumns(),
      disableAddTask: false
    };
    
    const result = await saveDataToGitHub(octokit, githubConfig, customerId, boardData, 'Create new customer account');
    
    if (result.success) {
      showToast(`Customer '${customerId}' created. Changes may take a few minutes to appear due to GitHub API caching.`, 'success');
      // Reload customer list
      await loadAdminCustomers();
    } else {
      showToast(result.error || 'Failed to create customer', 'error');
    }
    
    isLoading = false;
  }
  
  // Handle admin customer deletion
  async function handleAdminDeleteCustomer(customerId: string) {
    isLoading = true;
    
    const result = await deleteDataFromGitHub(octokit, githubConfig, customerId);
    
    if (result.success) {
      showToast(`Customer '${customerId}' deleted. Changes may take a few minutes to appear due to GitHub API caching.`, 'success');
      // Reload customer list
      await loadAdminCustomers();
    } else {
      showToast('Failed to delete customer', 'error');
    }
    
    isLoading = false;
  }
  
  // Handle account info update
  async function handleUpdateAccountInfo(newDisplayName: string, newUatEndDate: string, newDevSiteUrl: string, newPassword: string) {
    displayName = newDisplayName;
    uatEndDate = newUatEndDate;
    devSiteUrl = newDevSiteUrl;
    
    // Hash new password if provided, otherwise keep existing
    if (newPassword.trim()) {
      storedPasswordHash = await hashPassword(newPassword);
    }
    
    await handleSave();
  }

  // Handle password submission
  async function handlePasswordSubmit() {
    if (!passwordInput.trim()) {
      passwordError = 'Please enter a password';
      return;
    }

    isLoading = true;
    const id = customerId || usernameInput.toLowerCase();
    
    const result = await loadDataFromGitHub(octokit, githubConfig, id, passwordInput);
    
    if (result.success && result.data) {
      columns = result.data;
      isAuthenticated = true;
      isAdmin = false; // Regular user login
      
      // Store SHA for future updates
      if (result.sha) {
        fileSha = result.sha;
      }
      
      // Store password hash to reuse on saves
      if (result.passwordHash) {
        storedPasswordHash = result.passwordHash;
      }
      
      // Load disableAddTask setting
      disableAddTask = result.disableAddTask || false;
      displayName = result.displayName || '';
      uatEndDate = result.uatEndDate || '';
      devSiteUrl = result.devSiteUrl || '';
      
      // Save session for this customer
      saveSession(id, false);
      
      showToast('Data loaded successfully', 'success');
    } else {
      passwordError = result.error || 'Login failed';
    }
    
    isLoading = false;
  }

  // Simple save function called after user actions
  async function handleSave() {
    if (!isAuthenticated || !columns || columns.length === 0) return;
    
    // If already saving, mark that we need another save after this one
    if (isSaving) {
      hasPendingSave = true;
      return;
    }
    
    isSaving = true;
    hasPendingSave = false;
    
    try {
      const boardData: BoardData = {
        displayName,
        uatEndDate,
        devSiteUrl,
        passwordHash: storedPasswordHash,
        version: STORAGE_VERSION,
        columns,
        disableAddTask
      };
      
      const id = customerId || usernameInput.toLowerCase();
      const result = await saveDataToGitHub(octokit, githubConfig, id, boardData, 'Save changes', fileSha);
      
      if (result.success) {
        if (result.sha) {
          fileSha = result.sha;
        }
        showToast('Changes saved', 'success');
      } else {
        showToast(result.error || 'Failed to save changes', 'error');
      }
    } finally {
      isSaving = false;
      
      // If another save was requested while we were saving, process it now
      if (hasPendingSave) {
        // Small delay to avoid immediate retry
        setTimeout(() => handleSave(), 100);
      }
    }
  }

  // Toast functions
  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = toastId++;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 3000);
  }

  // Drag and drop handlers
  function handleDragStart(e: DragEvent, item: Task, columnId: ColumnId) {
    draggedItem = item;
    draggedFromColumn = columnId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(e: DragEvent, columnId: ColumnId) {
    e.preventDefault();
    dragOverColumn = columnId;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDragLeave() {
    dragOverColumn = null;
  }

  function handleDrop(e: DragEvent, targetColumnId: ColumnId) {
    e.preventDefault();
    dragOverColumn = null;

    if (!draggedItem || !draggedFromColumn) return;

    const sourceColumn = columns.find(c => c.id === draggedFromColumn);
    const targetColumn = columns.find(c => c.id === targetColumnId);

    if (!sourceColumn || !targetColumn) return;

    if (draggedFromColumn === targetColumnId) {
      draggedItem = null;
      draggedFromColumn = null;
      return;
    }

    sourceColumn.items = sourceColumn.items.filter(item => item.id !== draggedItem!.id);
    
    // Automatically lock task when moving out of To-Do column (once locked, stays locked)
    if (targetColumnId !== 'todo') {
      draggedItem.locked = true;
    }
    
    targetColumn.items = [...targetColumn.items, draggedItem];

    columns = [...columns];
    showToast(`Moved to ${targetColumn.title}`, 'success');

    draggedItem = null;
    draggedFromColumn = null;
    
    handleSave();
  }

  // Modal handlers
  function openNewItemModal() {
    isNewItem = true;
    selectedItem = null;
    selectedColumnId = 'todo';
    originalColumnId = null;
    isModalViewOnly = false;
    modalData = {
      description: '',
      device: 'All',
      feedback: '',
      section: '',
      images: []
    };
    originalModalData = { ...modalData };
    validationError = '';
    showModal = true;
  }

  function openModal(item: Task, columnId: ColumnId) {
    isNewItem = false;
    selectedItem = item;
    selectedColumnId = columnId;
    originalColumnId = columnId;
    // Set view-only mode if customer tries to view In Progress task
    isModalViewOnly = !isAdmin && columnId === 'inprogress' || columnId === 'done';
    modalData = {
      description: item.description,
      type: item.type,
      device: item.device,
      feedback: item.feedback || '',
      section: item.section || '',
      images: item.images || []
    };
    originalModalData = { ...modalData };
    validationError = '';
    showModal = true;
  }

  function toggleTaskLock(itemId: number) {
    // Find the task across all columns and toggle its locked status
    for (const column of columns) {
      const task = column.items.find(item => item.id === itemId);
      if (task) {
        task.locked = !task.locked;
        columns = [...columns]; // Trigger reactivity
        showToast(task.locked ? 'Task locked' : 'Task unlocked', 'success');
        handleSave();
        return;
      }
    }
  }

  function closeModal() {
    showModal = false;
    selectedItem = null;
    originalModalData = null;
  }

  function hasUnsavedChanges(): boolean {
    if (!originalModalData) return false;
    return JSON.stringify(modalData) !== JSON.stringify(originalModalData) ||
           selectedColumnId !== originalColumnId;
  }

  function attemptCloseModal() {
    if (!isModalViewOnly && hasUnsavedChanges()) {
      showUnsavedChanges = true;
    } else {
      closeModal();
    }
  }

  function discardChanges() {
    showUnsavedChanges = false;
    closeModal();
  }

  function saveAndClose() {
    showUnsavedChanges = false;
    saveModal();
  }

  function saveModal() {
    if (!modalData.description.trim()) {
      validationError = 'Description is required';
      return;
    }

    validationError = '';

    if (isNewItem) {
      const now = new Date().toISOString();
      const newItem: Task = {
        id: Date.now(),
        description: modalData.description.trim(),
        type: modalData.type,
        device: modalData.device,
        feedback: modalData.feedback.trim(),
        section: modalData.section.trim(),
        createdAt: now,
        updatedAt: now,
        locked: selectedColumnId !== 'todo',
        images: modalData.images || []
      };

      const targetColumn = columns.find(c => c.id === selectedColumnId);
      if (targetColumn) {
        targetColumn.items = [...targetColumn.items, newItem];
        columns = [...columns];
        showToast('Task added successfully', 'success');
        closeModal();
        handleSave();
        return;
      }
    } else if (selectedItem) {
      selectedItem.description = modalData.description.trim();
      selectedItem.type = modalData.type;
      selectedItem.device = modalData.device;
      selectedItem.feedback = modalData.feedback.trim();
      selectedItem.section = modalData.section.trim();
      selectedItem.images = modalData.images || [];

      if (originalColumnId !== selectedColumnId) {
        const sourceColumn = columns.find(c => c.id === originalColumnId);
        const targetColumn = columns.find(c => c.id === selectedColumnId);

        if (sourceColumn && targetColumn) {
          // Automatically lock when moving out of To-Do (once locked, stays locked)
          if (selectedColumnId !== 'todo') {
            selectedItem.locked = true;
          }
          
          sourceColumn.items = sourceColumn.items.filter(item => item.id !== selectedItem!.id);
          targetColumn.items = [...targetColumn.items, selectedItem];
          columns = [...columns];
          showToast(`Updated and moved to ${targetColumn.title}`, 'success');
        }
      } else {
        columns = [...columns];
        showToast(`Updated "${modalData.description}"`, 'success');
      }
    }
    closeModal();
    handleSave();
  }

  function confirmDelete() {
    showDeleteConfirm = true;
  }

  async function executeDelete() {
    if (selectedItem && originalColumnId) {
      const column = columns.find(c => c.id === originalColumnId);
      if (column) {
        column.items = column.items.filter(item => item.id !== selectedItem!.id);
        columns = [...columns];
        showToast('Task deleted', 'info');
        
        // Save with skipMerge to prevent deleted task from being restored
        if (!isSaving) {
          isSaving = true;
          try {
            const boardData: BoardData = {
              displayName,
              uatEndDate,
              devSiteUrl,
              passwordHash: storedPasswordHash,
              version: STORAGE_VERSION,
              columns,
              disableAddTask
            };
            
            const id = customerId || usernameInput.toLowerCase();
            const result = await saveDataToGitHub(octokit, githubConfig, id, boardData, 'Delete task', fileSha);
            
            if (result.success) {
              if (result.sha) {
                fileSha = result.sha;
              }
              showToast('Changes saved', 'success');
            } else {
              showToast(result.error || 'Failed to save changes', 'error');
            }
          } finally {
            isSaving = false;
          }
        }
      }
    }
    showDeleteConfirm = false;
    closeModal();
  }

  function cancelDelete() {
    showDeleteConfirm = false;
  }

  function openHelpModal() {
    showHelpModal = true;
  }

  function closeHelpModal() {
    showHelpModal = false;
  }
</script>

<nav class="navbar">
  <div class="nav-left">
    <div class="employ-logo">
      <img src={logo} alt="Talemetry" width="150" />
    </div>
  </div>
  <div class="nav-right">
    {#if isAuthenticated && devSiteUrl}
      <ButtonComponent
        text="Open Dev Site"
        href={devSiteUrl.startsWith('http') ? devSiteUrl : `https://${devSiteUrl}`}
        type="hollow"
        target="_blank"
        rel="nofollow noopener"
      />
    {/if}
  </div>
</nav>

{#if isAdminMode}
  <AdminList
    customers={adminCustomers}
    {isLoading}
    bind:isAuthenticated={isAdminAuthenticated}
    bind:passwordInput={adminPasswordInput}
    bind:passwordError={adminPasswordError}
    onPasswordSubmit={handleAdminPasswordSubmit}
    onSelectCustomer={handleAdminSelectCustomer}
    onCreateCustomer={handleAdminCreateCustomer}
    onDeleteCustomer={handleAdminDeleteCustomer}
  />
{:else if !isAuthenticated}
  <Login
    bind:customerId
    bind:usernameInput
    bind:passwordInput
    bind:passwordError
    bind:isLoading
    onSubmit={handlePasswordSubmit}
    onForgotPassword={() => showToast('You cannot reset your password here. Please reach out and we will provide you with your password.', 'info')}
  />
{:else}
  <Board
    displayName={displayName}
    uatEndDate={uatEndDate}
    devSiteUrl={devSiteUrl}
    customerId={customerId || usernameInput}
    {columns}
    {isAdmin}
    bind:searchQuery
    bind:filterType
    bind:draggedItem
    bind:dragOverColumn
    bind:disableAddTask
    onAddTask={openNewItemModal}
    onHelp={openHelpModal}
    onItemDragStart={handleDragStart}
    onItemClick={openModal}
    onToggleLock={toggleTaskLock}
    onDrop={handleDrop}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onUpdateAccountInfo={handleUpdateAccountInfo}
    onSave={handleSave}
  />

  <TaskModal
    show={showModal}
    isNew={isNewItem}
    isViewOnly={isModalViewOnly}
    isLocked={selectedItem?.locked || false}
    bind:modalData
    bind:selectedColumnId
    {columns}
    {isAdmin}
    {validationError}
    onSave={saveModal}
    onDelete={confirmDelete}
    onCancel={attemptCloseModal}
  />

  <ConfirmModal
    show={showDeleteConfirm}
    type="delete"
    onConfirm={executeDelete}
    onCancel={cancelDelete}
  />

  <ConfirmModal
    show={showUnsavedChanges}
    type="unsaved"
    onCancel={() => showUnsavedChanges = false}
    onDiscard={discardChanges}
    onSave={saveAndClose}
  />

  <HelpModal
    show={showHelpModal}
    {disableAddTask}
    onClose={closeHelpModal}
  />
{/if}

<ToastComponent bind:toasts />

<style>
  .navbar {
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2.5rem;
    min-height: 100px;
    background: var(--navbar-bg);
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 0 1 auto;
  }

  .nav-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
    flex: 1;
  }

  .employ-logo {
    width: 150px;
    height: auto;
    margin-top: 0.3333rem;
  }
</style>

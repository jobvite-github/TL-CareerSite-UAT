<script lang="ts">
  let {
    customers,
    isLoading,
    isAuthenticated = $bindable(false),
    passwordInput = $bindable(''),
    passwordError = $bindable(''),
    onPasswordSubmit,
    onSelectCustomer,
    onCreateCustomer,
    onDeleteCustomer
  }: {
    customers: Array<{ name: string; path: string }>;
    isLoading: boolean;
    isAuthenticated: boolean;
    passwordInput: string;
    passwordError: string;
    onPasswordSubmit: () => void;
    onSelectCustomer: (customerId: string) => void;
    onCreateCustomer: (customerId: string, password: string) => void;
    onDeleteCustomer: (customerId: string) => void;
  } = $props();
  
  let showCreateForm = $state(false);
  let newCustomerId = $state('');
  let newCustomerPassword = $state('');
  let createError = $state('');
  let deleteConfirmId = $state<string | null>(null);
  
  function handleSubmit(e: Event) {
    e.preventDefault();
    onPasswordSubmit();
  }
  
  function toggleCreateForm() {
    showCreateForm = !showCreateForm;
    if (!showCreateForm) {
      newCustomerId = '';
      newCustomerPassword = '';
      createError = '';
    }
  }
  
  function handleCreateSubmit(e: Event) {
    e.preventDefault();
    
    if (!newCustomerId.trim()) {
      createError = 'Customer ID is required';
      return;
    }
    
    if (!newCustomerPassword.trim()) {
      createError = 'Password is required';
      return;
    }
    
    // Check if customer already exists
    if (customers.some(c => c.name === `${newCustomerId.toLowerCase()}.json`)) {
      createError = 'Customer already exists';
      return;
    }
    
    onCreateCustomer(newCustomerId.toLowerCase(), newCustomerPassword);
    
    // Reset form
    newCustomerId = '';
    newCustomerPassword = '';
    createError = '';
    showCreateForm = false;
  }
  
  function handleDeleteClick(customerId: string, e: Event) {
    e.stopPropagation();
    deleteConfirmId = customerId;
  }
  
  function confirmDelete() {
    if (deleteConfirmId) {
      onDeleteCustomer(deleteConfirmId);
      deleteConfirmId = null;
    }
  }
  
  function cancelDelete() {
    deleteConfirmId = null;
  }
</script>

{#if !isAuthenticated}
  <div class="admin-container">
    <div class="admin-box">
      <h1>Admin Access</h1>
      <p class="subtitle">Enter admin password to continue</p>
      
      <form onsubmit={handleSubmit}>
        <div class="form-group">
          <label for="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            bind:value={passwordInput}
            placeholder="Enter admin password"
            disabled={isLoading}
          />
        </div>
        
        {#if passwordError}
          <div class="error-message">{passwordError}</div>
        {/if}
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Verifying...' : 'Access Admin'}
        </button>
      </form>
    </div>
  </div>
{:else}
  <div class="admin-container">
    <div class="admin-box">
      <h1>Admin Mode</h1>
      <p class="subtitle">Select a customer to view their board</p>
      
      {#if isLoading}
        <div class="loading">Loading customers...</div>
      {:else if customers.length === 0}
        <p class="no-customers">No customer data files found.</p>
      {:else}
        <ul class="customer-list">
          {#each customers as customer}
            <li class="customer-item">
              <button 
                class="customer-button" 
                onclick={() => onSelectCustomer(customer.name.replace('.json', ''))}
              >
                {customer.name.replace('.json', '')}
              </button>
              <button
                class="delete-btn"
                onclick={(e) => handleDeleteClick(customer.name.replace('.json', ''), e)}
                title="Delete customer"
              >
                🗑️
              </button>
            </li>
          {/each}
        </ul>
      {/if}
      
      <div class="admin-actions">
        <button class="create-toggle-btn" onclick={toggleCreateForm}>
          {showCreateForm ? 'Cancel' : '+ Create New Customer'}
        </button>
        
        {#if showCreateForm}
          <form class="create-form" onsubmit={handleCreateSubmit}>
            <div class="form-group">
              <label for="new-customer-id">Customer ID</label>
              <input
                id="new-customer-id"
                type="text"
                bind:value={newCustomerId}
                placeholder="customer-name"
              />
            </div>
            
            <div class="form-group">
              <label for="new-customer-password">Password</label>
              <input
                id="new-customer-password"
                type="password"
                bind:value={newCustomerPassword}
                placeholder="Enter password"
              />
            </div>
            
            {#if createError}
              <div class="error-message">{createError}</div>
            {/if}
            
            <button type="submit" class="create-submit-btn">
              Create Customer
            </button>
          </form>
        {/if}
      </div>
    </div>
  </div>
  
  {#if deleteConfirmId}
    <div class="modal-overlay" onclick={cancelDelete}>
      <div class="confirm-modal" onclick={(e) => e.stopPropagation()}>
        <h2>Delete Customer</h2>
        <p>Are you sure you want to delete <strong>{deleteConfirmId}</strong>?</p>
        <p class="warning">This will permanently delete their data file.</p>
        <div class="modal-actions">
          <button class="cancel-btn" onclick={cancelDelete}>Cancel</button>
          <button class="confirm-btn" onclick={confirmDelete}>Delete</button>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .admin-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-1);
    padding: 2rem;
  }

  .admin-box {
    background: var(--bg-2);
    padding: 3rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 500px;
  }

  h1 {
    text-align: center;
    color: var(--fg-1);
    margin-bottom: 0.5rem;
  }

  .subtitle {
    text-align: center;
    color: var(--fg-2);
    margin-bottom: 2rem;
  }

  .loading,
  .no-customers {
    text-align: center;
    color: var(--fg-2);
    padding: 2rem;
  }

  .customer-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 60vh;
    overflow-y: auto;
  }

  .customer-item {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .customer-button {
    flex: 1;
    padding: 1rem;
    background: var(--bg-1);
    color: var(--fg-1);
    border: 2px solid var(--bg-3);
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .customer-button:hover {
    background: var(--bg-3);
    border-color: #4CAF50;
  }

  .customer-button:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  }
  
  .delete-btn {
    padding: 0.75rem 1rem;
    background: var(--bg-1);
    color: var(--fg-1);
    border: 2px solid var(--bg-3);
    border-radius: 4px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .delete-btn:hover {
    background: #d32f2f;
    border-color: #d32f2f;
    color: white;
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

  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--bg-3);
    border-radius: 4px;
    font-size: 1rem;
    background: var(--bg-1);
    color: var(--fg-1);
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .form-group input:focus {
    outline: none;
    border-color: #4CAF50;
  }

  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .error-message {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #ffebee;
    color: #c62828;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  form button {
    width: 100%;
    padding: 0.75rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  form button:hover:not(:disabled) {
    background: #45a049;
  }

  form button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .admin-actions {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--bg-3);
  }
  
  .create-toggle-btn {
    width: 100%;
    padding: 0.75rem;
    background: var(--bg-1);
    color: var(--fg-1);
    border: 2px solid #4CAF50;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .create-toggle-btn:hover {
    background: #4CAF50;
    color: white;
  }
  
  .create-form {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background: var(--bg-1);
    border-radius: 4px;
  }
  
  .create-submit-btn {
    width: 100%;
    padding: 0.75rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .create-submit-btn:hover {
    background: #45a049;
  }
  
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
  
  .confirm-modal {
    background: var(--bg-2);
    padding: 2rem;
    border-radius: 8px;
    max-width: 400px;
    width: 90%;
  }
  
  .confirm-modal h2 {
    margin: 0 0 1rem 0;
    color: var(--fg-1);
  }
  
  .confirm-modal p {
    margin: 0.5rem 0;
    color: var(--fg-2);
  }
  
  .confirm-modal .warning {
    color: #d32f2f;
    font-weight: 600;
  }
  
  .modal-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .cancel-btn,
  .confirm-btn {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .cancel-btn {
    background: var(--bg-3);
    color: var(--fg-1);
  }
  
  .cancel-btn:hover {
    background: var(--bg-1);
  }
  
  .confirm-btn {
    background: #d32f2f;
    color: white;
  }
  
  .confirm-btn:hover {
    background: #b71c1c;
  }
</style>

<!-- <script>
  import { onMount } from 'svelte';

  // Svelte 5 runes syntax
  let files = $state([]);
  let selectedFile = $state('');
  let loading = $state(true);
  let error = $state('');

  // Props
  let { onFileSelect = () => {} } = $props();

  // Fetch files from API
  async function fetchFiles() {
    try {
      loading = true;
      const response = await fetch('/api/files');
      const data = await response.json();
      
      if (response.ok) {
        files = data.files;
        error = '';
        
        // Auto-select first file if available
        if (files.length > 0) {
          selectedFile = files[0].path;
          // Call the callback with the first file
          onFileSelect(files[0]);
        }
      } else {
        error = data.error || 'Failed to fetch files';
      }
    } catch (err) {
      error = 'Network error occurred';
      console.error('Error fetching files:', err);
    } finally {
      loading = false;
    }
  }

  // Handle file selection
  function handleFileChange(event) {
    selectedFile = event.target.value;
    
    // Find the selected file object
    const selected = files.find(file => file.path === selectedFile);
    
    // Call the callback with the selected file
    onFileSelect(selected || null);
  }

  // Fetch files when component mounts
  onMount(fetchFiles);
</script>

<div class="file-dropdown">
  <label for="file-select">Select a file:</label>
  
  {#if loading}
    <p>Loading files...</p>
  {:else if error}
    <p class="error">Error: {error}</p>
    <button onclick={fetchFiles}>Retry</button>
  {:else if files.length === 0}
    <p>No files found in the data folder</p>
  {:else}
    <select 
      id="file-select" 
      bind:value={selectedFile}
      onchange={handleFileChange}
    >
      {#each files as file}
        <option value={file.path}>{file.name}</option>
      {/each}
    </select>
  {/if}

  {#if selectedFile}
    <p>Selected: {selectedFile}</p>
  {/if}
</div>

<style>
  .file-dropdown {
    margin: 1rem 0;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }

  select {
    width: 100%;
    max-width: 300px;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }

  .error {
    color: red;
    margin: 0.5rem 0;
  }

  button {
    padding: 0.5rem 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 0.5rem;
  }

  button:hover {
    background-color: #0056b3;
  }
</style> -->
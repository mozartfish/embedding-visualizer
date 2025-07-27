<script>
    import FileSearchBox from '$lib/components/FileDropdown.svelte';
    
    let selectedFile = $state('');
    
    const fileUrl = $derived(() => selectedFile ? `/data/${selectedFile}` : '');
    
    // Function to handle the selected file
    function handleFileSelection() {
        if (selectedFile) {
            console.log('File URL:', fileUrl());
            
            // You can now fetch the file content, display it, etc.
            // fetch(fileUrl()).then(response => response.text()).then(content => {
            //     console.log('File content:', content);
            // });
        }
    }
</script>

<main>
    <h1>Data</h1>
    
    <FileSearchBox bind:selectedFile placeholder="Select Data File" />
    
    {#if selectedFile}
        <p>Selected: {selectedFile}</p>
        <button onclick={handleFileSelection}>Load File</button>
    {/if}
</main>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

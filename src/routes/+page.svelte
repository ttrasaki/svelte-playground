<script lang="ts">
	import { onMount } from 'svelte';
	
	let count: number = 0;
	
	function increment(): void {
		count += 1;
	}
</script>

<h1>Welcome to Svelte Playground!</h1>

<p>This is a basic Svelte project running in a devContainer.</p>

<button on:click={increment}>
	Count is {count}
</button>

<style>
	h1 {
		color: #ff3e00;
		text-align: center;
		margin: 2rem 0;
	}
	
	button {
		background: #ff3e00;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}
	
	button:hover {
		background: #e63900;
	}
</style>
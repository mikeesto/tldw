<script>
	import { enhance } from '$app/forms';
	export let form;

	let isLoading = false;

	function handleSubmit(event) {
		isLoading = true;
		event.target.submit();
	}
</script>

<div class="min-h-screen flex flex-col">
	<header class="bg-gray-900 text-white py-4 px-4">
		<h1 class="text-lg font-bold">Media Summariser</h1>
	</header>

	{#if !form}
		<main class="flex flex-col justify-center items-center flex-grow p-4">
			<h2 class="text-2xl mb-6 text-gray-700 text-center">Get summaries of YouTube videos</h2>
			<form class="flex flex-col sm:flex-row gap-2" method="post" on:submit={handleSubmit}>
				<input
					class="px-4 w-96 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:shadow-md"
					type="text"
					placeholder="Paste YouTube URL here"
					name="url"
				/>

				<button
					type="submit"
					class="px-4 py-2 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 disabled:bg-gray-500"
					disabled={isLoading}
				>
					Summarise
				</button>
			</form>
		</main>
	{:else}
		<main class="p-4">
			<a class="text-blue-500 mb-4 block" href="/">← Summarise another video</a>
			<h2 class="text-2xl mb-6 text-gray-700">Summary</h2>
			<p>{form.response}</p>
			<!-- {#if form.responses}
				{#each form.responses as response}
					<p class="mb-2">{response}</p>
				{/each}
			{/if} -->
			<!-- <p>{JSON.stringify(form.responses)}</p> -->
		</main>
	{/if}
</div>

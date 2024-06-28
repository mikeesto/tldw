<script>
	export let form;
	$: form = form || { summary: false };

	let isLoading = false;

	function handleSubmit(event) {
		isLoading = true;
		event.target.submit();
	}
</script>

<main class="flex flex-col justify-center items-center flex-grow p-4">
	<h1 class="text-2xl mb-6 text-gray-700 text-center">Summarise YouTube videos with AI</h1>
	<form
		class="flex flex-col sm:flex-row gap-2"
		method="post"
		action="/summary"
		on:submit={handleSubmit}
	>
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
	{#if form.error}
		<p class="text-red-500 mt-2">{form.error}</p>
	{/if}
</main>

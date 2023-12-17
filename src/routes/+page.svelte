<script>
	export let form;
	$: form = form || { summary: false };

	let isLoading = false;

	function handleSubmit(event) {
		isLoading = true;
		event.target.submit();
	}
</script>

<div class="min-h-screen flex flex-col">
	<header class="bg-gray-900 text-white py-4 px-4">
		<h1 class="text-lg font-bold">YT Summariser</h1>
	</header>

	{#if !form.summary}
		<main class="flex flex-col justify-center items-center flex-grow p-4">
			<h2 class="text-2xl mb-6 text-gray-700 text-center">Summarise YouTube videos with AI</h2>
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
			{#if form.error}
				<p class="text-red-500 mt-2">{form.error}</p>
			{/if}
		</main>
	{:else}
		<main class="p-4">
			<a class="text-blue-500 mb-4 block" href="/">← Summarise another video</a>
			<h2 class="text-2xl mb-6 text-gray-700">
				Summary for <a
					class="text-blue-700"
					target="_blank"
					href={`https://youtube.com/watch?v=${form.id}`}>{form.title}</a
				>
			</h2>
			<p>{form.summary}</p>
		</main>
	{/if}
</div>

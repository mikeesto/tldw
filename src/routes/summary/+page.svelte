<script>
	export let form;
	$: form = form;
</script>

<main class="p-4 flex-grow max-w-[1000px] m-auto">
	<a
		class="text-blue-700 underline text-2xl mb-4 block"
		target="_blank"
		href={`https://youtube.com/watch?v=${form.id}`}>{form.title}</a
	>
	{#if form.question}
		<form action="/question" method="POST">
			<input type="hidden" name="id" value={form.id} />
			<input type="hidden" name="title" value={form.title} />
			<input type="hidden" name="transcript" value={form.transcript} />
			<button type="submit" class="border-gray-200 border bg-blue-200 rounded-md p-2">
				💡 Hmm, the video title asks: {form.title} . Would you like an answer?
			</button>
		</form>
	{/if}
	<img
		class="m-auto rounded-sm my-3"
		src={`https://img.youtube.com/vi/${form.id}/hqdefault.jpg`}
		alt="Thumbnail"
	/>
	<div class="rounded-md border-gray-200 border">
		{#if form.summary}
			<p class="p-5">{form.summary}</p>
		{/if}

		{#if form.error}
			<div class="text-red-700">
				{form.error}
			</div>
		{/if}
	</div>
	<a class=" bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded mt-3 inline-block" href="/">
		← Summarise another video
	</a>
</main>

<script>
	import '../app.pcss';
</script>

<div class="min-h-screen flex flex-col">
	<header class="bg-gray-900 text-white py-4 px-4">
		<a class="text-lg font-bold" href="/">YT Summariser</a>
	</header>
	<slot />
	<footer>
		<div class="bg-gray-900 text-white py-4">
			<p class="text-center">
				<a class="text-white hover:text-blue-400" href="https://mikeesto.com">@mikeesto</a>
			</p>
		</div>
	</footer>
</div>

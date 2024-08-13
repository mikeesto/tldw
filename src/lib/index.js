// place files you want to import through the `$lib` alias in this folder.
export function trimLLMResponse(response) {
	// Remove the 'ANSWER:' prefix if it exists
	const responseArray = response.split(':');
	if (responseArray.length > 1) responseArray.shift();
	return responseArray.join(':').trim();
}

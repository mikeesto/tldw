import { fetchTranscript } from 'youtube-subtitle-transcript';
import { ANYSCALE_KEY } from '$env/static/private';

async function summarise(transcript) {
	const requestOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${ANYSCALE_KEY}`
		},
		body: JSON.stringify({
			model: 'Open-Orca/Mistral-7B-OpenOrca',
			messages: [
				{
					role: 'system',
					content: 'Summarize this YouTube video. Make sure to identify the main talking points.'
				},
				{ role: 'user', content: transcript }
			],
			temperature: 0.7
		})
	};

	return fetch('https://api.endpoints.anyscale.com/v1/chat/completions', requestOptions)
		.then((response) => response.json())
		.then((data) => data.choices[0].message.content)
		.catch((error) => console.error('Error:', error));
}

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const url = data.get('url');
		let id = '';

		if (url.includes('youtu.be')) {
			id = url.split('/').pop().split('?')[0]; // Split on '/' and remove any query params
		} else if (url.includes('youtube.com')) {
			const youtubeUrl = new URL(url);
			const params = new URLSearchParams(youtubeUrl.search);
			id = params.get('v');
		} else {
			return { error: "Sorry! I don't know how to handle that URL" };
		}

		// Fetch the video transcript
		const transcript = await fetchTranscript(id);

		// Combine the transcript into a single string
		const transcriptString = transcript.map((t) => t.text).join(' ');

		// Run the summarizer
		const summary = await summarise(transcriptString);

		// // Create parts of the transcript, where each part is no more than 4000 characters
		// const parts = [];
		// let part = '';
		// for (const word of splitTranscript) {
		// 	if (part.length + word.length > 3500) {
		// 		parts.push(part);
		// 		part = '';
		// 	}
		// 	part += word + ' ';
		// }

		// // Push the last part into parts if it is not empty
		// if (part.length > 0) {
		// 	parts.push(part);
		// }

		// console.log('parts: ', parts.length);

		// // Run each transcript bundle through the summarizer in parallel
		// let responses = await Promise.all(
		// 	parts.map((part) => run('@cf/meta/llama-2-7b-chat-int8', part))
		// );

		return { summary };
	}
};

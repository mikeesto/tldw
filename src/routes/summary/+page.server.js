import { OPENROUTER_API_KEY, RAPID_API_KEY } from '$env/static/private';
import { trimLLMResponse } from '$lib';
import { redirect } from '@sveltejs/kit';

export async function load({ request }) {
	if (request.method !== 'POST') {
		throw redirect(303, '/');
	}
}

async function summarise(transcript) {
	const requestOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${OPENROUTER_API_KEY}`
		},
		body: JSON.stringify({
			model: 'meta-llama/llama-3.1-8b-instruct:free',
			messages: [
				{
					role: 'system',
					content: `Your job is to summarize this YouTube video transcript. 
					Your answer should be multiple sentences long, and contain no markdown.
					Your response must have the following format:
					ANSWER: here, you write your summary
					`
				},
				{ role: 'user', content: transcript }
			],
			temperature: 0.5
		})
	};

	return fetch('https://openrouter.ai/api/v1/chat/completions', requestOptions)
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

		const rapidVideoDetailsURL = `https://youtube-media-downloader.p.rapidapi.com/v2/video/details?videoId=${id}`;
		const options = {
			method: 'GET',
			headers: {
				'x-rapidapi-key': RAPID_API_KEY,
				'x-rapidapi-host': 'youtube-media-downloader.p.rapidapi.com'
			}
		};

		const response = await fetch(rapidVideoDetailsURL, options).then((res) => res.json());

		if (!response.status) {
			return { error: 'Sorry! I could not find that video' };
		}

		const { title, lengthSeconds, subtitles } = response;

		// Don't allow durations over 30 minutes
		if (lengthSeconds >= 1800) {
			return { error: 'Sorry! I only support videos under 30 minutes long' };
		}

		// Check subtitles url
		if (subtitles.length === 0) {
			return { error: 'Sorry! This video cannot be summarised' };
		}

		const subtitleURL = subtitles.items[0].url;

		const rapidSubtitlesURL = `https://youtube-media-downloader.p.rapidapi.com/v2/video/subtitles?subtitleUrl=${encodeURIComponent(
			subtitleURL
		)}&format=json`;

		const subtitlesJSON = await fetch(rapidSubtitlesURL, options).then((res) => res.json());

		const transcript = subtitlesJSON.map((t) => t.text).join(' ');

		let summary = await summarise(transcript);
		summary = trimLLMResponse(summary);

		// Check if video title begins with 'what', 'how' or 'why'
		const titleArray = title.toLowerCase().split(' ');
		const firstWord = titleArray[0];
		const question = ['what', 'how', 'why'].includes(firstWord);

		return { summary, title, id, question, transcript };
	}
};

import { fetchTranscript } from 'youtube-subtitle-transcript';
import { ANYSCALE_KEY, YOUTUBE_KEY } from '$env/static/private';
import { iso8601ToSeconds, trimLLMResponse } from '$lib';
import { redirect } from '@sveltejs/kit';

export async function load({ request }) {
	if (request.method !== 'POST') {
		throw redirect(303, '/');
	}
}

async function getVideoDetails(id) {
	return fetch(
		`https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails&id=${id}&key=${YOUTUBE_KEY}`
	)
		.then((response) => response.json())
		.then((data) => {
			const video = data.items[0];
			if (!video) return { error: 'Sorry! I could not find that video' };

			const title = video.snippet.title;
			const duration = iso8601ToSeconds(video.contentDetails.duration);
			return { title, duration };
		});
}

async function summarise(transcript) {
	const requestOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${ANYSCALE_KEY}`
		},
		body: JSON.stringify({
			model: 'meta-llama/Meta-Llama-3-8B-Instruct',
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

		const { title, duration, error } = await getVideoDetails(id);

		if (error) return { error };

		// Don't allow durations over 30 minutes
		if (duration >= 1800) {
			return { error: 'Sorry! I only support videos under 30 minutes long' };
		}

		// Check if video title begins with 'what', 'how' or 'why'
		const titleArray = title.toLowerCase().split(' ');
		const firstWord = titleArray[0];
		const question = ['what', 'how', 'why'].includes(firstWord);

		const { transcript } = await fetchTranscript(id);

		if (transcript.length < 1) {
			return { error: 'Sorry! This video cannot be summarised' };
		}

		// Combine the transcript into a single string
		const transcriptString = transcript.map((t) => t.text).join(' ');

		let summary = await summarise(transcriptString);
		summary = trimLLMResponse(summary);

		return { summary, title, id, question };
	}
};

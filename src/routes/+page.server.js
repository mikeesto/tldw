import { fetchTranscript } from 'youtube-subtitle-transcript';
import { ANYSCALE_KEY, YOUTUBE_KEY } from '$env/static/private';
import { iso8601ToSeconds } from '$lib';

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

		const { title, duration, error } = await getVideoDetails(id);

		if (error) return { error };

		// Don't allow durations over 30 minutes
		if (duration >= 1800) {
			return { error: 'Sorry! I only support videos under 30 minutes long' };
		}

		const transcript = await fetchTranscript(id);

		// Combine the transcript into a single string
		const transcriptString = transcript.map((t) => t.text).join(' ');

		const summary = await summarise(transcriptString);

		return { summary, title, id };
	}
};

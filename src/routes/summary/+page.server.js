import { OPENROUTER_API_KEY, RAPID_API_KEY } from '$env/static/private';
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
			Authorization: `Bearer ${OPENROUTER_API_KEY}`,
			'X-Title': 'Media Summariser',
			'HTTP-Referer': 'https://yt-summary.vercel.app/'
		},
		body: JSON.stringify({
			model: 'openrouter/free',
			messages: [
				{
					role: 'system',
					content: `Your job is to summarize this YouTube video transcript. 
					Your answer should be multiple sentences long, and contain no markdown.
					Your response should contain the summary only.
					`
				},
				{ role: 'user', content: transcript }
			],
			temperature: 0.5
		})
	};

	try {
		const response = await fetch('https://openrouter.ai/api/v1/chat/completions', requestOptions);

		if (!response.ok) {
			throw new Error(`OpenRouter API error: ${response.status}`);
		}

		const data = await response.json();

		if (!data?.choices?.[0]?.message?.content) {
			throw new Error('Invalid response structure from OpenRouter API');
		}

		return {
			summary: data.choices[0].message.content,
			model: data.model.split(':')[0] // only include model name
		};
	} catch (error) {
		console.error('Error in summarise:', error);
		throw new Error('Failed to generate summary');
	}
}

function extractVideoId(url) {
	try {
		if (url.includes('youtu.be')) {
			return url.split('/').pop().split('?')[0];
		} else if (url.includes('youtube.com')) {
			const youtubeUrl = new URL(url);
			const params = new URLSearchParams(youtubeUrl.search);
			const id = params.get('v');
			if (!id) {
				throw new Error('No video ID found');
			}
			return id;
		}
		throw new Error('Unsupported URL format');
	} catch (error) {
		throw new Error("Sorry! I don't know how to handle that URL");
	}
}

export const actions = {
	default: async ({ request }) => {
		try {
			const data = await request.formData();
			const url = data.get('url');

			if (!url || typeof url !== 'string') {
				return { error: 'Please provide a valid URL' };
			}

			// Extract video ID
			let id;
			try {
				id = extractVideoId(url);
			} catch (error) {
				return { error: error.message };
			}

			// Fetch video details
			const rapidVideoDetailsURL = `https://youtube-media-downloader.p.rapidapi.com/v2/video/details?videoId=${id}&urlAccess=blocked`;
			const options = {
				method: 'GET',
				headers: {
					'x-rapidapi-key': RAPID_API_KEY,
					'x-rapidapi-host': 'youtube-media-downloader.p.rapidapi.com'
				}
			};

			const res = await fetch(rapidVideoDetailsURL, options);

			if (!res.ok) {
				console.error('RapidAPI video details error:', res.status, await res.text());
				return { error: 'Sorry! I could not find that video' };
			}

			const response = await res.json();

			if (!response || typeof response !== 'object') {
				console.error('Invalid response from RapidAPI');
				return { error: 'Received invalid data from video service' };
			}

			const { title, lengthSeconds, subtitles } = response;

			// Validate required fields
			if (!title) {
				return { error: 'Could not retrieve video title' };
			}

			if (!lengthSeconds || isNaN(lengthSeconds)) {
				return { error: 'Could not determine video length' };
			}

			// Don't allow durations over 60 minutes
			if (lengthSeconds >= 3600) {
				return { title, id, error: 'Only videos under 60 minutes long are supported. Sorry!' };
			}

			// Validate subtitles
			if (!subtitles || !Array.isArray(subtitles.items) || subtitles.items.length === 0) {
				return { error: 'Sorry! This video has no subtitles available' };
			}

			const subtitleURL = subtitles.items[0]?.url;
			if (!subtitleURL) {
				return { error: 'Sorry! Could not access video subtitles' };
			}

			// Fetch subtitles
			const rapidSubtitlesURL = `https://youtube-media-downloader.p.rapidapi.com/v2/video/subtitles?subtitleUrl=${encodeURIComponent(
				subtitleURL
			)}&format=json`;

			const subtitlesRes = await fetch(rapidSubtitlesURL, options);

			if (!subtitlesRes.ok) {
				console.error('RapidAPI subtitles error:', subtitlesRes.status);
				return { error: 'Failed to retrieve subtitles' };
			}

			const subtitlesJSON = await subtitlesRes.json();

			// Validate subtitles data
			if (!Array.isArray(subtitlesJSON) || subtitlesJSON.length === 0) {
				return { error: 'No subtitle content available' };
			}

			const transcript = subtitlesJSON
				.map((t) => t?.text || '')
				.filter((text) => text.trim().length > 0)
				.join(' ');

			if (!transcript || transcript.trim().length === 0) {
				return { error: 'Could not extract transcript from subtitles' };
			}

			// Generate summary
			const { summary, model } = await summarise(transcript);

			if (!summary || summary.trim().length === 0) {
				return { error: 'Generated summary was empty. Please try again.' };
			}

			// Check if video title begins with 'what', 'how' or 'why'
			const titleArray = title.toLowerCase().split(' ');
			const firstWord = titleArray[0];
			const question = ['what', 'how', 'why'].includes(firstWord);

			return { summary, title, id, question, transcript, model };
		} catch (error) {
			console.error('Unexpected error in action:', error);
			return { error: 'An unexpected error occurred. Please try again.' };
		}
	}
};

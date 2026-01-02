import { OPENROUTER_API_KEY } from '$env/static/private';
import { trimLLMResponse } from '$lib';
import { redirect } from '@sveltejs/kit';

export async function load({ request }) {
	if (request.method !== 'POST') {
		throw redirect(303, '/');
	}
}

async function getAnswer(transcript, title) {
	const requestOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${OPENROUTER_API_KEY}`
		},
		body: JSON.stringify({
			model: 'xiaomi/mimo-v2-flash:free',
			messages: [
				{
					role: 'system',
					content: `Your job is to answer the question as best as you can based only on the transcript. 
					Your answer should be multiple sentences long, and contain no markdown.
					Your response must have the following format:
					ANSWER: here, you write your answer
					`
				},
				{ role: 'user', content: `QUESTION: ${title}? \n TRANSCRIPT: ${transcript}` }
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
		const id = data.get('id');
		const title = data.get('title');
		const transcript = data.get('transcript');

		let answer = await getAnswer(transcript, title);
		answer = trimLLMResponse(answer);

		return { title, answer, id };
	}
};

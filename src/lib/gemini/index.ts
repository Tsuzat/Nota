import { GoogleGenAI } from '@google/genai';

export enum GeminiModel {
	FlashLite = 'gemini-2.5-flash-lite',
	Flash = 'gemini-2.5-flash',
	Pro = 'gemini-2.5-pro'
}

/**
 * Calls the Gemini AI model to generate a streaming response.
 *
 * @param prompt - The input prompt to send to the model.
 * @param onChunck - Callback invoked with each text chunk as it arrives.
 * @param onError - Optional callback invoked if an error occurs during generation.
 * @param model - The Gemini model to use; defaults to GeminiModel.FlashLite.
 * @param thinkingConfig - Optional configuration for model thinking settings.
 * @returns A promise that resolves when streaming is complete.
 * @throws If the API key is missing and onError is not provided.
 */
export async function callGeminiAI(
	prompt: string,
	onChunck: (chunk: string) => void,
	onError?: (error: Error) => void,
	model: GeminiModel = GeminiModel.FlashLite
) {
	try {
		const apiKey = localStorage.getItem('gemini_api_key');
		if (apiKey === null) {
			onError?.(new Error('Please set it in your settings/AI to use this feature.'));
			return;
		}
		const genai = new GoogleGenAI({ apiKey });
		const responseStream = await genai.models.generateContentStream({
			model,
			contents: prompt,
			config: {
				systemInstruction: `You are an expert Note Optimizer designed to 
            analyze, enhance, and structure a user's raw input or existing notes, 
            functioning like an integrated AI assistant in a modern note-taking application. 
            Your primary goal is to transform unstructured text into clear, organized, and 
            actionable knowledge. You only need to return the output in markdown format and nothing else. 
            Just the output. When writting a mathematical expression using LaTeX, enclose the expression 
            in two dollars($$). e.g. $$\\LaTeX$$. `
			}
		});
		for await (const chunk of responseStream) {
			if (chunk.text) onChunck(chunk.text);
		}
	} catch (error) {
		if (onError) onError(error instanceof Error ? error : new Error(String(error)));
	}
}

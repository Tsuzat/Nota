import { GoogleGenAI } from '@google/genai';
import { aiGenerate } from '@nota/client';
import { decrypt } from '$lib/components/settings';
import { systemInstruction } from './prompts';

/**
 * Calls the AI model to generate a streaming response.
 *
 * @param prompt - The input prompt to send to the model.
 * @package authToken - The authentication token for the API request.
 * @param onChunck - Callback invoked with each text chunk as it arrives.
 * @param onError - Optional callback invoked if an error occurs during generation.
 */
export async function callAI(prompt: string, onChunck: (chunk: string) => void, onError?: (error: Error) => void) {
  try {
    const res = await aiGenerate(prompt);
    if (!res.ok) {
      let message = 'Failed to call AI';
      try {
        const data = await res.json();
        message = data?.error ?? message;
      } catch {}
      const err = new Error(message);
      onError?.(err);
      return;
    }
    const reader = res.body?.getReader();
    if (!reader) {
      const err = new Error('Streaming not supported');
      onError?.(err);
      return;
    }
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        const text = decoder.decode(value, { stream: true });
        if (text) onChunck(text);
      }
    }
  } catch (error) {
    console.error(error);
    const err = error instanceof Error ? error : new Error('Unknown error');
    onError?.(err);
  }
}

/**
 * Calls the Gemini model to generate a streaming response.
 *
 * @param prompt - The input prompt to send to the model.
 * @param onChunck - Callback invoked with each text chunk as it arrives.
 * @param onError - Optional callback invoked if an error occurs during generation.
 * @returns
 */
export const callGemini = async (
  prompt: string,
  onChunck: (chunk: string) => void,
  onError?: (error: Error) => void
) => {
  const time = Date.now();
  const GEMINI_API_KEY = await decrypt(localStorage.getItem('geminiApiKeyEnc') || '');
  console.log(`Gemini API key decrypted in ${Date.now() - time}ms`);
  if (GEMINI_API_KEY.trim() === '') {
    const err = new Error('Gemini API key not found');
    onError?.(err);
    return;
  }
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const model = localStorage.getItem('geminiModel') || GEMINI_MODELS.GEMINI_2_5_FLASH_LITE;
  const res = await ai.models.generateContentStream({
    model,
    config: {
      systemInstruction,
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  });
  for await (const chunk of res) {
    const text = chunk.text;
    if (text) onChunck(text);
  }
};

export enum GEMINI_MODELS {
  GEMINI_2_5_FLASH_LITE = 'gemini-2.5-flash-lite',
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
  GEMINI_2_5_PRO = 'gemini-2.5-pro',
  GEMINI_3_FLASH = 'gemini-3-flash-preview',
  GEMINI_3_PRO = 'gemini-3-pro-preview',
}

import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import {fetch} from '@tauri-apps/plugin-http'

/**
 * Calls the AI model to generate a streaming response.
 *
 * @param prompt - The input prompt to send to the model.
 * @package authToken - The authentication token for the API request.
 * @param onChunck - Callback invoked with each text chunk as it arrives.
 * @param onError - Optional callback invoked if an error occurs during generation.
 */
export async function callAI(
  prompt: string,
  authToken: string,
  onChunck: (chunk: string) => void,
  onError?: (error: Error) => void
) {
  try {
    const res = await fetch(`${PUBLIC_NOTA_FRONTEND_URL}/api/ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ prompt }),
    });
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
    console.error(error)
    const err = error instanceof Error ? error : new Error('Unknown error');
    onError?.(err);
  }
}

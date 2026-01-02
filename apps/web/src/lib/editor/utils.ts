import { aiGenerate } from '@nota/client';

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
 * Generate a prompt string to be sent to the AI model.
 * @param userPrompt The specific instruction the user just typed.
 * @param precedingText The text immediately before the cursor (if any).
 * @param selectedText Text the user has highlighted (if any).
 * @returns A prompt string to be sent to the AI model.
 */
export const generatePrompt = (userPrompt: string, precedingText?: string, selectedText?: string) => {
  return `
    ${precedingText ? `[PRECEDING_TEXT]: ${precedingText}` : ''}
    ${selectedText ? `[SELECTED_TEXT]: ${selectedText}` : ''}
    [USER_PROMPT]: ${userPrompt}
    `;
};

export const SUMMARIZE_PROMPT = (text: string) => {
  const userPrompt = `
You are an expert editor. Summarize the text below.
Rules:
1. Capture the core meaning and key points.
2. If the text describes steps or a list, use a Markdown list.
3. If the text is narrative, use a concise paragraph.
4. Output ONLY the summary, no conversational filler.
`;
  return generatePrompt(userPrompt, undefined, text);
};

export const MAKE_SHORTER_PROMPT = (text: string) => {
  const userPrompt = `
Rewrite the text below to be more concise.
Rules:
1. Retain all key information and meaning.
2. Remove filler words, redundancy, and fluff.
3. Improve clarity and flow.
4. Output ONLY the rewritten text.
`;
  return generatePrompt(userPrompt, undefined, text);
};

export const MAKE_LONGER_PROMPT = (text: string) => {
  const userPrompt = `
Expand upon the text below.
Rules:
1. Add relevant details, examples, or context to provide depth.
2. Maintain the original tone and voice of the author.
3. Ensure the expansion flows naturally.
4. Output ONLY the expanded text.
`;
  return generatePrompt(userPrompt, undefined, text);
};

export const FIX_GRAMMAR_PROMPT = (text: string) => {
  const userPrompt = `
Act as a professional copy editor. specific_instructions:
1. Fix all grammar, spelling, and punctuation errors.
2. Improve sentence clarity and structure where needed.
3. STRICTLY PRESERVE the original author's voice, style, and intent. Do not rewrite the content, only polish it.
4. Output ONLY the corrected text.
`;
  return generatePrompt(userPrompt, undefined, text);
};

export const CONTINUE_WRITING_PROMPT = (text: string, preText?: string) => {
  const userPrompt = `
You are a co-author. Continue writing based on the context below.
Rules:
1. Strictly mimic the existing style, tone, and formatting (e.g., if it is a list, continue the list).
2. Ensure the continuation is logically consistent with the preceding text.
3. Do not repeat the last sentence provided.
4. Output ONLY the new content.
`;
  return generatePrompt(userPrompt, preText, text);
};

export const SOLVE_PROBLEM_PROMPT = (text: string) => {
  const userPrompt = `
You are a problem solver. Solve the problem below.
Rules:
1. Strictly mimic the existing style, tone, and formatting (e.g., if it is a list, continue the list).
2. Ensure the solution is logically consistent with the preceding text.
3. Do not repeat the last sentence provided.
4. Do not provide solution in a verbose way. Keep it concise.
5. Output ONLY the solution.
`;
  return generatePrompt(userPrompt, undefined, text);
};

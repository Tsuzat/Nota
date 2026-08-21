/**
 * Generate a prompt string to be sent to the AI model.
 * @param userPrompt The specific instruction the user just typed.
 * @param precedingText The text immediately before the cursor (if any).
 * @param selectedText Text the user has highlighted (if any).
 * @returns A prompt string to be sent to the AI model.
 */
export const generatePrompt = (
	userPrompt: string,
	precedingText?: string,
	selectedText?: string,
) => {
	return `
    ${precedingText ? `[PRECEDING_TEXT]: ${precedingText}` : ""}
    ${selectedText ? `[SELECTED_TEXT]: ${selectedText}` : ""}
    [USER_PROMPT]: ${userPrompt}
    `;
};

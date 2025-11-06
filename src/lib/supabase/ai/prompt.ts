export const SUMMARIZE_PROMPT = (text: string) => `
	Please summarize the following text:\n
	${text}
`;

export const MAKE_SHORTED_PROMPT = (text: string) => `
	Please make the following text shorter:\n
	${text}
`;

export const MAKE_LONGER_PROMPT = (text: string) => `
	Please make the following text longer:\n
	${text}
`;

export const FIX_GRAMMER_PROMPT = (text: string) => `
	Please fix the grammar in the following text:\n
	${text}
`;

export const CONTINUE_WRITING = (text: string) => `
	Please continue the following text:\n
	${text}
`;

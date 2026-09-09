export interface HtmlProcessorOptions {
	/**
	 * Target theme for diagram and code styling ('light' | 'dark' | 'system').
	 * Defaults to 'light' for print/PDF export, or follows current document theme.
	 */
	theme?: "light" | "dark" | "system";

	/**
	 * Whether to add a top header with language label above code blocks.
	 * Defaults to false for cleaner print/PDF.
	 */
	includeCodeHeader?: boolean;
}

export interface FullHtmlOptions extends HtmlProcessorOptions {
	/**
	 * Document title. Defaults to 'Untitled Note'.
	 */
	title?: string;

	/**
	 * Set to true if the content body has already been processed by getHTMLBody.
	 * When false or omitted, getFullHTML will automatically invoke getHTMLBody.
	 */
	alreadyProcessed?: boolean;

	/**
	 * Custom CSS to inject into the document head.
	 */
	customStyles?: string;
}

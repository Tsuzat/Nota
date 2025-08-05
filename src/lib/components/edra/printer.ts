/**
 * Prints an HTML element as PDF with all CSS styles preserved
 * @param element - The HTML element to print
 * @param options - Optional configuration for printing
 */
interface PrintElementOptions {
	windowTitle?: string;
	pageMargin?: string;
	preserveColors?: boolean;
	useNewWindow?: boolean;
	closeWindowAfterPrint?: boolean;
	printDelay?: number;
}

export async function printElementAsPDF(
	element: HTMLElement,
	options: PrintElementOptions = {}
): Promise<void> {
	const {
		windowTitle = 'Print',
		pageMargin = '0.5in',
		preserveColors = true,
		useNewWindow = false,
		printDelay = 250
	} = options;

	if (useNewWindow) {
		return;
	}

	// Store original content
	const originalTitle = document.title;
	const originalBody = document.body.cloneNode(true) as HTMLElement;

	try {
		// Set document title
		document.title = windowTitle;

		// Get all styles from the document
		const allStyles = getAllDocumentStyles();

		// Create print styles
		const printStyles = createPrintStyles(pageMargin, preserveColors);

		// Replace body content with only the target element
		document.body.innerHTML = '';
		document.body.appendChild(element.cloneNode(true));

		// Add styles to head
		const styleElement = document.createElement('style');
		styleElement.id = 'temp-print-styles';
		styleElement.textContent = allStyles + printStyles;
		document.head.appendChild(styleElement);

		// Wait for styles to apply
		await new Promise((resolve) => setTimeout(resolve, printDelay));

		// Print
		window.print();
	} finally {
		// Restore original content
		document.title = originalTitle;
		document.body.innerHTML = '';
		document.body.appendChild(originalBody);

		// Remove temporary styles
		const tempStyles = document.getElementById('temp-print-styles');
		if (tempStyles) {
			tempStyles.remove();
		}
	}
}

/**
 * Extracts all CSS styles from the current document
 */
function getAllDocumentStyles(): string {
	let styles = '';

	// Get styles from all stylesheets
	Array.from(document.styleSheets).forEach((styleSheet) => {
		try {
			const rules = styleSheet.cssRules || styleSheet.rules;
			if (rules) {
				Array.from(rules).forEach((rule) => {
					styles += rule.cssText + '\n';
				});
			}
		} catch (e) {
			// Handle CORS issues with external stylesheets
			console.warn('Cannot access stylesheet:', styleSheet.href, e);

			// Try to get stylesheet via fetch if it's from same origin
			if (styleSheet.href && styleSheet.href.startsWith(window.location.origin)) {
				fetch(styleSheet.href)
					.then((response) => response.text())
					.then((css) => (styles += css + '\n'))
					.catch(() => console.warn('Failed to fetch stylesheet:', styleSheet.href));
			}
		}
	});

	// Get inline styles from <style> elements
	Array.from(document.querySelectorAll('style')).forEach((styleElement) => {
		styles += styleElement.textContent + '\n';
	});

	return styles;
}

function createPrintStyles(pageMargin: string, preserveColors: boolean): string {
	return `
    @media print {
      @page {
        margin: ${pageMargin};
        size: A4;
      }

      body {
        margin: 0;
        padding: 0;
        font-size: 12pt;
        line-height: 1.3;
      }

      * {
        ${
					preserveColors
						? `
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        `
						: ''
				}
        box-sizing: border-box;
      }

      /* Avoid page breaks inside elements */
      div, section, article, p, h1, h2, h3, h4, h5, h6 {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Ensure images fit on page */
      img {
        max-width: 100% !important;
        height: auto !important;
        page-break-inside: avoid;
      }

      /* Hide elements that shouldn't be printed */
      .no-print {
        display: none !important;
      }

      /* Ensure visibility */
      * {
        visibility: visible !important;
      }
    }
  `;
}

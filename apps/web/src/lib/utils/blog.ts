import { toast } from '@nota/ui/shadcn/sonner';

/**
 * Copies the current page URL to the clipboard with proper error handling.
 * Falls back gracefully if Clipboard API is unavailable or denied.
 */
export async function copyArticleLink() {
  if (typeof window === 'undefined') return;

  if (!navigator?.clipboard) {
    toast.error('Clipboard access is unavailable');
    return;
  }

  try {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  } catch {
    toast.error('Failed to copy link');
  }
}

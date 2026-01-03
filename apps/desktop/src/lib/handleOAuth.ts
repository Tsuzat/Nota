import { toast } from '@nota/ui/shadcn/sonner';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

export function useDeepLinkAuth(callbacks: { onCode: (code: string) => Promise<void> }) {
  const handleUrl = async (urls: string[]) => {
    const id = toast.loading('Processing your request', {
      description: 'This may take a moment',
      duration: 10000,
    });
    try {
      const url = urls[0];
      const urlObj = new URL(url);
      const searchParams = new URLSearchParams(urlObj.search.substring(1));
      const code = searchParams.get('code');
      if (code) {
        await callbacks.onCode(code);
      }
    } catch (err) {
      console.error('Error handling deep link:', err);
      toast.error('Something went wrong', { id });
    } finally {
      toast.dismiss(id);
    }
  };
  onOpenUrl(handleUrl);
}

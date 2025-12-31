import { getAuthContext } from '@nota/client';
import { toast } from '@nota/ui/shadcn/sonner';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

export function useDeepLinkAuth() {
  const handleUrl = async (urls: string[]) => {
    const id = toast.loading('Processing your request', {
      description: 'This may take a moment',
      duration: 10000,
    });
    try {
      const url = urls[0];
      const urlObj = new URL(url);
      const searchParams = new URLSearchParams(urlObj.search.substring(1));

      const access_token = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');
      console.log({ urlObj, searchParams, refresh_token, access_token });
      if (access_token && refresh_token) {
        await getAuthContext().exchangeTokenForSession(access_token, refresh_token);
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

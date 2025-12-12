import { Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { toast } from '@nota/ui/shadcn/sonner';

export async function downloadAndInstall(update: Update) {
  const id = toast.info(`Downloading version ${update.version} `);
  let downloaded = 0;
  let contentLength = 0;
  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        contentLength = (event.data.contentLength ?? 0) / 1e6;
        toast.loading(`Downloading update ${update.version}...`, {
          id,
          description: `Started downloading ${contentLength.toFixed(2)} MB`,
        });
        break;
      case 'Progress':
        downloaded += event.data.chunkLength;
        toast.loading(`Downloading update ${update.version}...`, {
          id,
          description: `Downloaded ${(downloaded / 1e6).toFixed(2)} / ${contentLength.toFixed(2)} MB`,
        });

        break;
      case 'Finished':
        toast.success(`Update ${update.version} downloaded. Installing...`, {
          description: undefined,
          id,
        });
        break;
    }
  });
  toast.success(`Update ${update.version} installed. Relaunching...`, {
    description: undefined,
    id,
  });
  await relaunch();
}

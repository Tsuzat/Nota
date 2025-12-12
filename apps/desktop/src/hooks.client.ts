import { checkAndCreateAssetsDir, initializeLocalDB } from '$lib/local/db';
import { ISWINDOWS } from '$lib/utils';
import { getCurrentWindow } from '@tauri-apps/api/window';

(async () => {
  await initializeLocalDB();
  await checkAndCreateAssetsDir();
  const window = getCurrentWindow();
  if (ISWINDOWS) {
    await window.setDecorations(false);
  }
})();

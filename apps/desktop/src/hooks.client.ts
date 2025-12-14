import { getCurrentWindow } from '@tauri-apps/api/window';
import { checkAndCreateAssetsDir, initializeLocalDB } from '$lib/local/db';
import { ISWINDOWS } from '$lib/utils';

(async () => {
  await initializeLocalDB();
  await checkAndCreateAssetsDir();
  const window = getCurrentWindow();
  if (ISWINDOWS) {
    await window.setDecorations(false);
  }
})();

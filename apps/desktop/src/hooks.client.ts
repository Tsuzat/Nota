import { checkAndCreateAssetsDir, initializeLocalDB } from "$lib/local/db";
import { ISWINDOWS } from "$lib/utils";
import { getCurrentWindow } from "@tauri-apps/api/window";

const init = async () => {
  const window = getCurrentWindow();
  if (ISWINDOWS) {
    await window.setDecorations(false);
  }

  await initializeLocalDB();
  await checkAndCreateAssetsDir();
};

init();

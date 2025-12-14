import Database from '@tauri-apps/plugin-sql';
import { BaseDirectory, exists, mkdir } from '@tauri-apps/plugin-fs';
import { toast } from '@nota/ui/shadcn/sonner';
import schema from './schema';

export let DB: Database;

export async function initializeLocalDB() {
  try {
    DB = await Database.load('sqlite:nota.db');
    await DB.execute(schema);
    console.log('Sqlite database loaded successfully');
  } catch (e) {
    console.error(e);
    toast.error('Failed to load database');
  }
}

export async function checkAndCreateAssetsDir() {
  const existsAssets = await exists('assets', {
    baseDir: BaseDirectory.AppData,
  });
  if (!existsAssets) {
    await mkdir('assets', { baseDir: BaseDirectory.AppData });
  }
}

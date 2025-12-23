import { FileType } from '@nota/ui/edra/utils.js';
import { toast } from '@nota/ui/shadcn/sonner';
import { supabase } from '.';

/**
 * Gets assets from the storage by file type
 * @param id - user id
 * @param fileType - type of the file
 * @returns array of public urls of the assets
 */
export async function getAssetsByFileType(id: string, fileType: FileType): Promise<string[]> {
  try {
    const path = `${id}/${fileType.split('/')[0]}`;
    console.log('PATH = ', path);
    const { data, error } = await supabase.storage.from('notes media').list(path);
    if (error) {
      console.error(error);
      toast.error(error.message);
      return [] as string[];
    }
    const urls = [];
    for (const file of data) {
      if (file.name === '.emptyFolderPlaceholder') continue;
      urls.push(supabase.storage.from('notes media').getPublicUrl(`${path}/${file.name}`).data.publicUrl);
    }
    return urls;
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong when loading assets.');
    return [];
  }
}

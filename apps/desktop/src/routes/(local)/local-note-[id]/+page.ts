import { ISTAURI } from '$lib/utils';
import { toast } from 'svelte-sonner';
import type { PageLoad } from './$types';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

export const load: PageLoad = async ({ params }) => {
  if (!ISTAURI) {
    toast.warning('Can not load a local note in browser');
    goto(resolve('/home'));
    return;
  }
  const id = params.id;
  return {
    id,
  };
};

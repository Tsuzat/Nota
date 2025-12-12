import { ISTAURI } from '$lib/utils';
import { toast } from 'svelte-sonner';
import type { PageLoad } from './$types';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

export const load: PageLoad = async ({ params }) => {
  if (!ISTAURI) {
    toast.warning('Can not load a local workspace in browser');
    goto(resolve('/home'));
    return;
  }

  return {
    id: params.id,
  };
};

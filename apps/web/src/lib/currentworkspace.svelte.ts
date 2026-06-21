import type { Workspace } from '@nota/client';

export const currentWorkspace = $state({
  value: null as Workspace | null
});

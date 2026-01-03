import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

export const load = async ({ parent }) => {
  const { user } = await parent();
  if (!user) {
    return goto(resolve('/login'));
  }
};

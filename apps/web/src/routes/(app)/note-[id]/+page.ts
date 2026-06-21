import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, parent }) => {
  return {
    id: params.id,
  };
};

export const ssr = false;
export const prerender = false;

export const load = async ({ data: { user } }) => {
  return {
    user,
  };
};

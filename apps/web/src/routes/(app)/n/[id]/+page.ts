export const load = async ({ params, depends }) => {
  depends('data:collab-token');
  return {
    id: params.id,
  };
};

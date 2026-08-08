export const load = async ({ params, cookies, depends }) => {
  depends("data:collab-token");
  const token = cookies.get("access_token");
  return {
    id: params.id,
    token,
  };
};

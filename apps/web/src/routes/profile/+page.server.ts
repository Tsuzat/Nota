import { redirect } from "@sveltejs/kit";

export const load = ({ locals: { user, session } }) => {
  if (user === null || session === null) {
    throw redirect(303, "/signin");
  }
  return {
    user,
    session,
  };
};

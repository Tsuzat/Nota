import { redirect } from "@sveltejs/kit";

export const load = ({ locals: { user } }) => {
  if (!user) {
    throw redirect(303, "/signin");
  }
};

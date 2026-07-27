import { POLAR_MONTLY_SUB, POLAR_YEARLY_SUB } from "$env/static/private";
import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { redirect } from "@sveltejs/kit";

export const GET = ({ url, locals: { user } }) => {
  if (user === null) {
    throw redirect(303, "/signin");
  }
  const monthly = url.searchParams.get("type") === "monthly";
  let productId = "";
  if (monthly) {
    productId = POLAR_MONTLY_SUB;
  } else {
    productId = POLAR_YEARLY_SUB;
  }
  const sendTo = `${PUBLIC_BACKEND_URL}/api/v1/payments/checkout?productId=${productId}`;
  return redirect(303, sendTo);
};

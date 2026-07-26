import { env } from "$env/dynamic/private";
import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { redirect } from "@sveltejs/kit";

export const GET = ({ url, locals: { user } }) => {
  if (user === null) {
    throw redirect(303, "/signin");
  }
  const monthly = url.searchParams.get("type") === "monthly";
  let productId = "";
  if (monthly) {
    productId = env.POLAR_MONTLY_SUB;
  } else {
    productId = env.POLAR_YEARLY_SUB;
  }
  const sendTo = `${PUBLIC_BACKEND_URL}/api/v1/payments/checkout?productId=${productId}&customerExternalId=${user.id}&customerEmail=${user.email}&customerName=${user.name}`;
  return redirect(303, sendTo);
};

import { env } from "$env/dynamic/private";
import { redirect } from "@sveltejs/kit";
import { env as envPublic } from "$env/dynamic/public";

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
  const sendTo = `${envPublic.PUBLIC_BACKEND_URL}/api/v1/payments/checkout?productId=${productId}&customerExternalId=${user.id}&customerEmail=${user.email}&customerName=${user.name}`;
  return redirect(303, sendTo);
};

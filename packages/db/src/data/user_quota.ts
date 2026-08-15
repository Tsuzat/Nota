import { db } from "..";

/**
 * Check if user quota for pro plan
 * @param userId user id
 * @returns true if user is pro, false otherwise
 */
export const isUserPro = async (userId: string) => {
  const userQuota = await db.query.userQuota.findFirst({
    where: { userId },
    columns: { planTier: true },
  });
  return userQuota?.planTier === "pro";
};

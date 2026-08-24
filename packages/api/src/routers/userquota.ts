import { getUserQuotaWithCache } from "@nota/cache/user_quota";
import { protectedProcedure } from "../index";

export const quotaRouter = {
	getQuota: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session.user.id;
		return await getUserQuotaWithCache(userId);
	}),
};

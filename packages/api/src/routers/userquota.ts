import { getCachedUserQuota, setCachedUserQuota } from "@nota/cache/user_quota";
import { getUserQuota } from "@nota/db/data/user_quota";
import { protectedProcedure } from "../index";

export const quotaRouter = {
	getQuota: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session.user.id;
		const cached = await getCachedUserQuota(userId);
		if (cached) return cached;

		const quota = await getUserQuota(userId);
		if (quota) {
			void setCachedUserQuota(userId, quota).catch(console.error);
		}
		return quota;
	}),
};

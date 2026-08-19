import { getUserQuota } from "@nota/db/data/user_quota";
import { protectedProcedure } from "../index";

export const quotaRouter = {
	getQuota: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session.user.id;
		const quota = await getUserQuota(userId);
		return quota;
	}),
};

import { db } from "../index";
import { userQuota, workspace } from "../schema/app";

/**
 * Initialize user data on signup.
 * @param opts Options containing the ownerId and optional user name.
 */
export const userInit = async (opts: {
	ownerId: string;
	name?: string | null;
}) => {
	const firstName = opts.name?.split(" ")[0] || "User";
	const workspaceName = `${firstName}'s space`;

	await db.transaction(async (tx) => {
		await tx.insert(userQuota).values({
			userId: opts.ownerId,
			planTier: "free",
		});

		await tx.insert(workspace).values({
			ownerId: opts.ownerId,
			name: workspaceName,
			icon: "emoji:📁",
		});
	});
};

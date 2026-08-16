import { toast } from "@nota/ui";
import { authClient } from "./auth-client";

export const handleSignout = async () => {
	const id = toast.loading("Signing out...", { duration: 10000 });
	await authClient.signOut({
		fetchOptions: {
			onError: () => {
				toast.error("Something went wrong! Please try again", { id });
			},
			onSuccess: () => {
				toast.success("Signed out successfully!", { id });
			},
		},
	});
};

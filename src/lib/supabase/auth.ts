import { toast } from 'svelte-sonner';
import { auth } from '.';

export const signInWithEmailAndPassword = async (email: string, password: string) => {
	const { error } = await auth.signInWithPassword({ email, password });
	if (error) {
		console.error(error);
		toast.error('Something went wrong', {
			description: error.message
		});
	}
};

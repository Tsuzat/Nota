<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { getGlobalSignInContext } from '.';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { auth } from '$lib/supabase';
	import { toast } from 'svelte-sonner';
	import { Loader } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import { PUBLIC_NOTA_ARTIFACT_URL } from '$env/static/public';
	import Google from './oauth/google.svelte';

	const signInContext = getGlobalSignInContext();

	const formData = $state({
		email: '',
		name: '',
		password: '',
		confirmPassword: ''
	});

	let isLoading = $state(false);

	async function signInWithEmailAndPassword(e: Event) {
		e.preventDefault();
		if (formData.email.trim() === '' || formData.password.trim() === '') return;
		isLoading = true;
		const { error } = await auth.signInWithPassword({
			email: formData.email,
			password: formData.password
		});
		if (error) {
			console.error(error);
			toast.error('Failed to sign in', { description: error.message });
		} else {
			signInContext.open = false;
		}
		isLoading = false;
	}

	async function createAccount(e: Event) {
		e.preventDefault();
		if (
			formData.name.trim() === '' ||
			formData.email.trim() === '' ||
			formData.password.trim() === '' ||
			formData.confirmPassword.trim() === ''
		)
			return;
		isLoading = true;
		const { error } = await auth.signUp({
			email: formData.email,
			password: formData.password,
			options: {
				emailRedirectTo: PUBLIC_NOTA_ARTIFACT_URL,
				data: {
					full_name: formData.name
				}
			}
		});
		if (error) {
			console.error(error);
			toast.error('Failed to create account', { description: error.message });
		} else {
			toast.success('Verify your email', {
				description: `We've sent a verification email to ${formData.email}.`
			});
			signInContext.open = false;
		}
		isLoading = false;
	}
</script>

<Dialog.Root bind:open={signInContext.open}>
	<Dialog.Content class="w-96">
		<Tabs.Root value="signin">
			<Tabs.List>
				<Tabs.Trigger value="signin">Sign In</Tabs.Trigger>
				<Tabs.Trigger value="signup">Create Account</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="signin" class="flex flex-col gap-4 py-4">
				<Dialog.Header>
					<Dialog.Title>Sign In</Dialog.Title>
					<Dialog.Description>
						Welcome back to Nota. Please use any of the followings to sign in.
					</Dialog.Description>
				</Dialog.Header>
				<!-- <div class="flex flex-col items-center gap-2">
					<Google />
					<div class="flex w-full items-center gap-4">
						<div class="bg-muted h-[1px] w-full"></div>
						<div>or</div>
						<div class="bg-muted h-[1px] w-full"></div>
					</div>
				</div> -->
				<form class="grid gap-4" onsubmit={signInWithEmailAndPassword}>
					<div class="grid gap-2">
						<Label for="email-signin">Email</Label>
						<Input
							id="email-signin"
							bind:value={formData.email}
							type="email"
							placeholder="m@example.com"
							autocomplete="email webauthn"
							required
						/>
					</div>
					<div class="grid gap-2">
						<div class="flex items-center">
							<Label for="password-signin">Password</Label>
							<a href="##" class="ml-auto inline-block text-sm underline">
								Forgot your password?
							</a>
						</div>
						<Input
							id="password-signin"
							type="password"
							bind:value={formData.password}
							autocomplete="current-password webauthn"
							placeholder="Password"
							required
						/>
					</div>
					<Dialog.Footer>
						<Button type="submit" class="w-full">
							{#if isLoading}
								<Loader class="animate-spin" />
							{/if}
							Sign In
						</Button>
					</Dialog.Footer>
				</form>
			</Tabs.Content>
			<Tabs.Content value="signup" class="flex flex-col gap-4 py-4">
				<Dialog.Header>
					<Dialog.Title>Sign Up</Dialog.Title>
					<Dialog.Description>
						Create a new account for Nota. Provide following information,
					</Dialog.Description>
				</Dialog.Header>
				<!-- <div class="flex flex-col items-center gap-2">
					<Google />
					<div class="flex w-full items-center gap-4">
						<div class="bg-muted h-[1px] w-full"></div>
						<div>or</div>
						<div class="bg-muted h-[1px] w-full"></div>
					</div>
				</div> -->
				<form class="grid gap-4" onsubmit={createAccount}>
					<div class="grid gap-2">
						<Label for="name-signup">Full Name</Label>
						<Input
							id="name-signup"
							bind:value={formData.name}
							type="text"
							placeholder="John Corner"
							autocomplete="name webauthn"
							required
						/>
					</div>
					<div class="grid gap-2">
						<Label for="email-signup">Email</Label>
						<Input
							id="email-signup"
							bind:value={formData.email}
							type="email"
							placeholder="m@example.com"
							autocomplete="email webauthn"
							required
						/>
					</div>
					<div class="grid gap-2">
						<Label for="password-signup">Password</Label>
						<Input
							id="password-signup"
							type="password"
							placeholder="Strong Password"
							bind:value={formData.password}
							autocomplete="current-password webauthn"
							required
						/>
					</div>
					<div class="grid gap-2">
						<Label for="confirm-password-signup">Confirm Password</Label>
						<Input
							class={cn(formData.password === formData.confirmPassword && 'bg-green-500')}
							id="confirm-password-signup"
							type="password"
							placeholder="Repeat Password"
							bind:value={formData.confirmPassword}
							autocomplete="current-password"
							required
						/>
					</div>
					<Dialog.Footer>
						<Button type="submit" class="w-full">
							{#if isLoading}
								<Loader class="animate-spin" />
							{/if}
							Create Account
						</Button>
					</Dialog.Footer>
				</form>
			</Tabs.Content>
		</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>

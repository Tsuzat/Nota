import { toast } from "@nota/ui";
import { createMutation } from "@tanstack/svelte-query";
import { orpc } from "#lib/orpc.ts";

export class CloudStorage {
	#workspaceId = $state<string>();
	#getWorkspaceId?: () => string | undefined;

	constructor(getWorkspaceId?: () => string | undefined) {
		this.#getWorkspaceId = getWorkspaceId;
	}

	get workspaceId(): string | undefined {
		return this.#getWorkspaceId ? this.#getWorkspaceId() : this.#workspaceId;
	}

	set workspaceId(value: string | undefined) {
		this.#workspaceId = value;
	}

	#uploadFileMutation = createMutation(() =>
		orpc.storage.uploadFile.mutationOptions(),
	);

	#confirmUploadMutation = createMutation(() =>
		orpc.storage.confirm.mutationOptions({
			onSuccess: () => {
				// Invalidate any queries related to assets if they exist later
			},
		}),
	);

	async upload(file: File, noteId: string) {
		const id = toast.loading(`Uploading ${file.name}...`);
		try {
			// 1. Get presigned URL
			const { signedUrl, objectKey } =
				await this.#uploadFileMutation.mutateAsync({
					noteId,
					name: file.name,
					mimeType: file.type || "application/octet-stream",
					size: file.size,
				});

			// 2. Upload directly to Cloudflare R2
			const response = await fetch(signedUrl, {
				method: "PUT",
				body: file,
				headers: {
					"Content-Type": file.type || "application/octet-stream",
				},
			});

			if (!response.ok) {
				throw new Error(`Upload failed: ${response.statusText}`);
			}

			// 3. Confirm upload and save to database
			const asset = await this.#confirmUploadMutation.mutateAsync({
				noteId,
				name: file.name,
				mimeType: file.type || "application/octet-stream",
				size: file.size,
				path: objectKey,
			});

			toast.success("File uploaded successfully!", { id });
			return asset;
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Error uploading file",
				{ id },
			);
			throw error;
		}
	}
}

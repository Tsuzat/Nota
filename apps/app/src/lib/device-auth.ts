import { openUrl } from "@tauri-apps/plugin-opener";
import { authClient } from "./auth-client";
import { secureStorage } from "./platform/securestorage";

const CLIENT_ID = "nota-desktop";
const GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";

export type DeviceAuthStatus =
	| "idle"
	| "requesting"
	| "pending"
	| "polling"
	| "success"
	| "error";

export interface DeviceAuthState {
	status: DeviceAuthStatus;
	userCode?: string;
	verificationUri?: string;
	errorMessage?: string;
}

/**
 * Start the device authorization flow.
 *
 * 1. Requests a device code from the server
 * 2. Opens the verification URL in the user's default browser
 * 3. Polls for the access token
 * 4. Stores the token in Stronghold on success
 */
export async function startDeviceAuth(
	onStateChange: (state: DeviceAuthState) => void,
): Promise<void> {
	onStateChange({ status: "requesting" });

	try {
		// Step 1: Request device code
		const { data, error } = await authClient.device.code({
			client_id: CLIENT_ID,
			scope: "openid profile email",
		});

		if (error || !data) {
			onStateChange({
				status: "error",
				errorMessage:
					error?.error_description ?? "Failed to request device authorization.",
			});
			return;
		}

		const {
			device_code,
			user_code,
			verification_uri,
			verification_uri_complete,
			interval = 5,
		} = data;

		// Step 2: Show the user code and open the browser
		onStateChange({
			status: "pending",
			userCode: user_code,
			verificationUri: verification_uri_complete || verification_uri,
		});

		const urlToOpen = verification_uri_complete || verification_uri;
		try {
			await openUrl(urlToOpen);
		} catch (e) {
			console.warn("Failed to open browser:", e);
		}

		// Step 3: Poll for the access token
		onStateChange({
			status: "polling",
			userCode: user_code,
			verificationUri: urlToOpen,
		});

		await pollForToken(device_code, interval, onStateChange);
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "An unexpected error occurred.";
		onStateChange({ status: "error", errorMessage: message });
	}
}

async function pollForToken(
	deviceCode: string,
	initialInterval: number,
	onStateChange: (state: DeviceAuthState) => void,
): Promise<void> {
	let pollingInterval = initialInterval;

	return new Promise<void>((resolve) => {
		const poll = async () => {
			try {
				const { data, error } = await authClient.device.token({
					grant_type: GRANT_TYPE,
					device_code: deviceCode,
					client_id: CLIENT_ID,
				});

				if (data?.access_token) {
					// Store the access token securely
					await secureStorage.setItem("access_token", data.access_token);

					onStateChange({ status: "success" });
					resolve();
					return;
				}

				if (error) {
					switch (error.error) {
						case "authorization_pending":
							console.log(
								`[Device Auth] Authorization pending, will retry in ${pollingInterval}s...`,
							);
							// Continue polling silently
							break;
						case "slow_down":
							pollingInterval += 5;
							console.log(
								`[Device Auth] Slow down requested. Increased interval to ${pollingInterval}s`,
							);
							break;
						case "access_denied":
							console.log(`[Device Auth] Access denied.`);
							onStateChange({
								status: "error",
								errorMessage: "Access was denied. Please try again.",
							});
							resolve();
							return;
						case "expired_token":
							console.log(`[Device Auth] Token expired.`);
							onStateChange({
								status: "error",
								errorMessage:
									"The authorization code has expired. Please try again.",
							});
							resolve();
							return;
						default:
							console.log(`[Device Auth] Unknown error:`, error);
							onStateChange({
								status: "error",
								errorMessage:
									error.error_description ?? `Error: ${error.error}`,
							});
							resolve();
							return;
					}
				}
			} catch (err) {
				console.error("[Device Auth] Polling exception:", err);
			}

			// Schedule the next poll
			setTimeout(poll, pollingInterval * 1000);
		};

		// Start polling after the initial interval
		setTimeout(poll, pollingInterval * 1000);
	});
}

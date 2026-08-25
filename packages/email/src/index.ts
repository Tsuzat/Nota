import { env } from "@nota/env/server";
import { Resend } from "resend";

export * from "./templates";

const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
	try {
		const { data, error } = await resend.emails.send({
			from: env.RESEND_FROM_EMAIL,
			to: [to],
			subject,
			html,
		});

		if (error) {
			console.error("Failed to send email:", error);
			throw error;
		}

		return data;
	} catch (error) {
		console.error("Error sending email:", error);
		throw error;
	}
}

import { type RequestHandler } from "@sveltejs/kit";
import { logerror } from "$lib/sentry";

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Read the body from the original request which is the Sentry envelope
    const envelope = await request.text();

    // The first line of the envelope is a JSON header containing the DSN.
    const dsn_line = envelope.split("\n")[0];
    const dsn = JSON.parse(dsn_line).dsn;

    // Ensure the DSN is present.
    if (!dsn) {
      return new Response("No DSN found in Sentry envelope", { status: 400 });
    }

    // Parse the DSN to get the project ID and Sentry hostname.
    const url = new URL(dsn);
    const projectId = url.pathname.substring(1);
    const sentryHost = url.hostname;

    // Construct the Sentry ingestion URL.
    const sentryIngestURL = `https://${sentryHost}/api/${projectId}/envelope/`;

    // Forward the envelope to Sentry's ingestion endpoint.
    const sentryResponse = await fetch(sentryIngestURL, {
      method: "POST",
      body: envelope,
      headers: {
        "Content-Type": "application/x-sentry-envelope",
      },
    });

    // Return Sentry's response back to the original client.
    return new Response(sentryResponse.body, {
      status: sentryResponse.status,
      headers: sentryResponse.headers,
    });
  } catch (e) {
    logerror("Error in Sentry tunnel:", { e });
    // Return a generic error response if something goes wrong.
    return new Response("Error forwarding event to Sentry", { status: 500 });
  }
};

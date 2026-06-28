import type { Session } from "./types";

export interface ParsedSession {
  browserName: string;
  osName: string;
  isActive: boolean;
  isCurrent: boolean;
  deviceType: string;
  createdAgo: string;
  location: string;
  platform: string;
}

export function parseSession(
  userAgent: string,
  session: Session,
  currentSessionId?: string,
): ParsedSession {
  const browserName = session.browser || "Unknown Browser";
  const osName = session.os || "Unknown OS";

  let deviceType = "Desktop";
  if (session.device === "mobile") {
    deviceType = "Mobile";
  } else if (session.device === "web") {
    // If it's web, it might be on mobile or desktop, check OS if we want to be specific, or rely on backend
    if (osName === "iOS" || osName === "Android") {
      deviceType = "Mobile";
    }
  }

  const now = new Date();
  const created = new Date(session.created_at);
  const expires = session.expires_at ? new Date(session.expires_at) : null;

  const isActive = !session.revoked && (!expires || expires > now);
  const isCurrent = currentSessionId === session.id;

  // Simple relative time (created ago)
  const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
  let createdAgo = "";
  if (diffInSeconds < 60) createdAgo = "just now";
  else if (diffInSeconds < 3600)
    createdAgo = `${Math.floor(diffInSeconds / 60)}m ago`;
  else if (diffInSeconds < 86400)
    createdAgo = `${Math.floor(diffInSeconds / 3600)}h ago`;
  else createdAgo = `${Math.floor(diffInSeconds / 86400)}d ago`;

  const location = session.country || "";
  let platform = "web";
  if (session.device === "desktop" || session.device === "web" || session.device === "mobile") {
    platform = session.device;
  } else {
    // Fallback for legacy sessions
    const ua = (userAgent || "").toLowerCase();
    if (ua.includes("tauri") || ua.includes("nota-desktop")) {
      platform = "desktop";
    }
  }

  return {
    browserName,
    osName,
    isActive,
    isCurrent,
    deviceType,
    createdAgo,
    location,
    platform,
  };
}

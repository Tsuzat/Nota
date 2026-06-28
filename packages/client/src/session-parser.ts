import type { Session } from './types';

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

export function parseSession(userAgent: string, session: Session, currentSessionId?: string): ParsedSession {
  let browserName = 'Unknown Browser';
  let osName = 'Unknown OS';
  let deviceType = 'Desktop';
  
  if (!userAgent) userAgent = '';

  const ua = userAgent.toLowerCase();

  // Browser detection
  if (ua.includes('zen')) {
    browserName = 'Zen';
  } else if (ua.includes('brave')) {
    browserName = 'Brave';
  } else if (ua.includes('edg')) {
    browserName = 'Edge';
  } else if (ua.includes('firefox') || ua.includes('fxios')) {
    browserName = 'Firefox';
  } else if (ua.includes('chrome') || ua.includes('crios')) {
    browserName = 'Chrome';
  } else if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios')) {
    browserName = 'Safari';
  }

  // OS detection
  if (ua.includes('mac') || ua.includes('macintosh') || ua.includes('mac os x')) {
    osName = 'macOS';
  } else if (ua.includes('win') || ua.includes('windows')) {
    osName = 'Windows';
  } else if (ua.includes('android')) {
    osName = 'Android';
    deviceType = 'Mobile';
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    osName = 'iOS';
    deviceType = 'Mobile';
  } else if (ua.includes('linux')) {
    osName = 'Linux';
  }

  const now = new Date();
  const created = new Date(session.created_at);
  const expires = session.expires_at ? new Date(session.expires_at) : null;
  
  const isActive = !session.revoked && (!expires || expires > now);
  const isCurrent = currentSessionId === session.id;

  // Simple relative time (created ago)
  const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
  let createdAgo = '';
  if (diffInSeconds < 60) createdAgo = 'just now';
  else if (diffInSeconds < 3600) createdAgo = `${Math.floor(diffInSeconds / 60)}m ago`;
  else if (diffInSeconds < 86400) createdAgo = `${Math.floor(diffInSeconds / 3600)}h ago`;
  else createdAgo = `${Math.floor(diffInSeconds / 86400)}d ago`;

  const location = session.country || '';
  let platform = 'web';
  if (session.device === 'desktop' || session.device === 'web') {
    platform = session.device;
  } else {
    // Fallback for legacy sessions
    if (ua.includes('tauri') || ua.includes('nota-desktop')) {
      platform = 'desktop';
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
    platform
  };
}

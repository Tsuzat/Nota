import { query } from '$app/server';
import { GITHUB_API_TOKEN } from '$env/static/private';
import type { ReleaseAssetsResponse } from '$lib/artifact/artifacts';
import { logerror } from '$lib/sentry';

interface ReleaseAsset {
  label: string;
  url: string;
}

type OSType = 'mac' | 'windows' | 'linux';

export const getArtefacts = query(async () => {
  try {
    const res = await fetch('https://api.github.com/repos/Tsuzat/Nota/releases/latest', {
      headers: {
        Authorization: `Bearer ${GITHUB_API_TOKEN}`,
        'User-Agent': 'Nota-Release-Fetcher',
        Accept: 'application/vnd.github+json',
      },
    });

    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

    const release = await res.json();

    const platforms: Record<OSType, ReleaseAsset[]> = {
      mac: [],
      windows: [],
      linux: [],
    };

    for (const asset of release.assets) {
      const name = asset.name.toLowerCase();
      const url = asset.browser_download_url;

      // macOS
      if (name.endsWith('.dmg')) {
        if (name.includes('aarch64')) {
          platforms.mac.push({ label: 'Apple Silicon', url });
        } else if (name.includes('x64') || name.includes('intel')) {
          platforms.mac.push({ label: 'Intel', url });
        }
      }

      // Windows
      if (name.endsWith('.exe')) {
        if (name.includes('arm64')) {
          platforms.windows.push({ label: 'ARM', url });
        } else if (name.includes('x64')) {
          platforms.windows.push({ label: 'x64', url });
        }
      }

      // Linux
      if (name.endsWith('.appimage')) {
        platforms.linux.push({ label: 'Linux (AppImage)', url });
      }
      if (name.endsWith('.deb')) {
        platforms.linux.push({ label: 'Linux (deb)', url });
      }
      if (name.endsWith('.rpm')) {
        platforms.linux.push({ label: 'Linux (rpm)', url });
      }
    }

    return {
      tag: release.tag_name,
      name: release.name,
      published_at: release.published_at,
      platforms,
    } as ReleaseAssetsResponse;
  } catch (error) {
    logerror('Failed to fetch artefacts', { error });
    return null;
  }
});

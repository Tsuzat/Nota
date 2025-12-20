import { query } from '$app/server';
import { GITHUB_API_TOKEN } from '$env/static/private';
import type { ReleaseAssetsResponse } from '$lib/artifact/artifacts';
import { redisClient } from '$lib/redis';
import { logerror } from '$lib/sentry';

interface ReleaseAsset {
  label: string;
  url: string;
}

type OSType = 'mac' | 'windows' | 'linux';

export const getArtefacts = query(async () => {
  try {
    // connect with redis and
    await redisClient.connect();
    const data = await redisClient.get('latest-artefacts');
    if (data) return JSON.parse(data) as ReleaseAssetsResponse;
    // Call Github API to get latest release
    const res = await fetch('https://api.github.com/repos/Tsuzat/Nota/releases/latest', {
      headers: {
        Authorization: `Bearer ${GITHUB_API_TOKEN}`,
        'User-Agent': 'Nota-Release-Fetcher',
        Accept: 'application/vnd.github+json',
      },
    });
    console.log('Status', res.ok);

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

    const artefacts: ReleaseAssetsResponse = {
      tag: release.tag_name,
      name: release.name,
      published_at: release.published_at,
      platforms,
    };
    // Write to Redis
    await redisClient.set('latest-artefacts', JSON.stringify(artefacts), { EX: 60 * 10 });
    return artefacts;
  } catch (error) {
    console.error(error);
    logerror('Failed to fetch artefacts', { error });
    return null;
  } finally {
    redisClient.destroy();
  }
});

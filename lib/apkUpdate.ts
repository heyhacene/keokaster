export interface LatestApkRelease {
  version: string;
  buildNumber: number | null;
  filename: string;
  downloadUrl: string;
  sizeBytes: number;
  releaseNotes: string;
  hasUpdate: boolean;
}

export const CURRENT_KASTER_BUILD = parseInt(
  process.env.NEXT_PUBLIC_BUILD_NUMBER || '9',
  10
);

export function getDirectKeoKasterApkUrl(buildNumber: number = CURRENT_KASTER_BUILD): string {
  return `https://github.com/heyhacene/keokaster/releases/download/v1.0.0-build.${buildNumber}/KeoKaster-Build-${buildNumber}.apk`;
}

export function getDirectKeoKasterApkFilename(buildNumber: number = CURRENT_KASTER_BUILD): string {
  return `KeoKaster-Build-${buildNumber}.apk`;
}

export const PERMANENT_LATEST_APK_URL = 'https://github.com/heyhacene/keokaster/releases/latest/download/KeoKaster.apk';

export async function fetchLatestKeoKasterApk(): Promise<LatestApkRelease> {
  const fallbackRelease: LatestApkRelease = {
    version: `v1.0.0-build.${CURRENT_KASTER_BUILD}`,
    buildNumber: CURRENT_KASTER_BUILD,
    filename: getDirectKeoKasterApkFilename(),
    downloadUrl: PERMANENT_LATEST_APK_URL,
    sizeBytes: 0,
    releaseNotes: '',
    hasUpdate: false,
  };

  try {
    const res = await fetch('https://api.github.com/repos/heyhacene/keokaster/releases/latest', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) return fallbackRelease;
    const data = await res.json();
    if (!data || !Array.isArray(data.assets)) return fallbackRelease;

    // Priorité absolue au fichier nommé KeoKaster-Build-XX.apk
    const buildAsset = data.assets.find(
      (a: any) =>
        typeof a.name === 'string' &&
        a.name.startsWith('KeoKaster-Build-') &&
        a.name.endsWith('.apk')
    );

    const asset =
      buildAsset ||
      data.assets.find(
        (a: any) => typeof a.name === 'string' && a.name.endsWith('.apk')
      );

    if (!asset) return fallbackRelease;

    const buildMatch =
      asset.name.match(/Build-(\d+)/i) ||
      data.tag_name?.match(/build\.(\d+)/i);
    const remoteBuildNum = buildMatch
      ? parseInt(buildMatch[1], 10)
      : CURRENT_KASTER_BUILD;

    const hasUpdate = remoteBuildNum > CURRENT_KASTER_BUILD;

    return {
      version: data.tag_name || `v1.0.0-build.${remoteBuildNum}`,
      buildNumber: remoteBuildNum,
      filename: asset.name,
      downloadUrl: asset.browser_download_url || PERMANENT_LATEST_APK_URL,
      sizeBytes: asset.size || 0,
      releaseNotes: data.body || '',
      hasUpdate,
    };
  } catch (err) {
    return fallbackRelease;
  }
}

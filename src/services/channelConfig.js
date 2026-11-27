/**
 * channelConfig.js — Vercel-centralized settings service
 *
 * Vercel Redis is the single source of truth for channel configs and app
 * settings (refreshInterval).  localStorage acts as an offline cache only.
 *
 * Flow: load remote → merge into state → save writes back to remote + local.
 */

const LOCAL_CACHE_KEY = 'smw_tv_remote_cache';

/** Load channels + settings from Vercel API (Redis). */
export async function loadRemoteChannelConfig() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch('/api/channels', {
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Configuration API HTTP ${response.status}`);
    const payload = await response.json();

    // Cache for offline fallback
    try {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(payload));
    } catch { /* quota */ }

    return {
      channels: Array.isArray(payload.channels) ? payload.channels : [],
      settings: payload.settings || {}
    };
  } catch (err) {
    // Offline fallback: return cached data if available
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const payload = JSON.parse(cached);
        return {
          channels: Array.isArray(payload.channels) ? payload.channels : [],
          settings: payload.settings || {},
          _fromCache: true
        };
      }
    } catch { /* ignore */ }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Save channels + settings to Vercel API (Redis). */
export async function saveRemoteChannelConfig(channels, settings) {
  const body = { channels };
  if (settings) {
    body.settings = settings;
  }
  const response = await fetch('/api/channels', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Configuration API HTTP ${response.status}`);
  }
  const result = await response.json();

  // Update offline cache
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({
      channels: result.channels || channels,
      settings: settings || {}
    }));
  } catch { /* quota */ }

  return result;
}

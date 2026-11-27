/* global process */
import { createClient } from 'redis';

const CONFIG_KEY = 'smw-tv:channel-configs-v2';
const SETTINGS_KEY = 'smw-tv:app-settings';

function getRedisClient() {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not configured');
  }
  return createClient({ url: process.env.REDIS_URL });
}

function normalizeChannel(channel) {
  const channelNo = String(channel.no || channel.channelNo || channel.channel_no || '').trim();
  const channelName = String(channel.name || channel.channelName || channel.channel_name || '').trim();
  const category = String(channel.category || 'Factory').trim();
  const description = String(channel.description || '').trim();
  const apiUrl = String(channel.apiUrl || channel.api_url || '').trim();
  const streamUrl = String(channel.streamUrl || channel.stream_url || '').trim();
  const viewType = String(channel.view || channel.viewType || channel.view_type || 'dashboard').trim();
  const thumbnail = String(channel.thumbnail || '').trim();
  const key = String(channel.key || `channel-${channelNo}`).trim();
  const enabled = channel.enabled !== false;
  const apiAction = String(channel.apiAction || 'getTVData').trim();

  if (!channelNo || !channelName || channelName.length > 120) {
    throw new Error('Invalid channel number or name');
  }
  if (apiUrl.length > 4096 || streamUrl.length > 4096) {
    throw new Error('URL is too long');
  }
  if (!['dashboard', 'iframe', 'video', 'settings'].includes(viewType)) {
    throw new Error('Invalid view type');
  }

  return {
    no: channelNo,
    key,
    name: channelName,
    category,
    description,
    apiUrl,
    streamUrl,
    view: viewType,
    streamType: viewType,
    thumbnail,
    enabled,
    hasData: Boolean(apiUrl),
    apiAction,
    updated_at: new Date().toISOString()
  };
}

function normalizeSettings(settings) {
  return {
    refreshInterval: Math.max(1, Math.min(60, parseInt(settings.refreshInterval) || 3)),
    updated_at: new Date().toISOString()
  };
}

export default async function handler(request, response) {
  // CORS headers for cross-origin Android WebView requests
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

  if (!process.env.REDIS_URL) {
    return response.status(503).json({
      error: 'Redis is not configured. Connect the Vercel Redis store first.'
    });
  }

  const redis = getRedisClient();
  try {
    await redis.connect();

    if (request.method === 'GET') {
      const [stored, settingsRaw] = await Promise.all([
        redis.get(CONFIG_KEY),
        redis.get(SETTINGS_KEY)
      ]);
      const channels = stored ? JSON.parse(stored) : [];
      const settings = settingsRaw ? JSON.parse(settingsRaw) : { refreshInterval: 3 };
      return response.status(200).json({ channels, settings });
    }

    if (request.method !== 'PUT' && request.method !== 'POST') {
      response.setHeader('Allow', 'GET, PUT, POST, OPTIONS');
      return response.status(405).json({ error: 'Method not allowed' });
    }

    const incoming = Array.isArray(request.body?.channels)
      ? request.body.channels
      : Array.isArray(request.body)
        ? request.body
        : [request.body || {}];

    if (!incoming.length || incoming.length > 60) {
      return response.status(400).json({ error: 'channels must contain between 1 and 60 records' });
    }

    const updates = incoming.map(normalizeChannel);
    const nextChannels = updates.sort((a, b) => a.no.localeCompare(b.no, undefined, { numeric: true }));

    // Save channels + app settings atomically
    const saveOps = [redis.set(CONFIG_KEY, JSON.stringify(nextChannels))];
    if (request.body?.settings) {
      const appSettings = normalizeSettings(request.body.settings);
      saveOps.push(redis.set(SETTINGS_KEY, JSON.stringify(appSettings)));
    }
    await Promise.all(saveOps);

    return response.status(200).json({
      saved: updates.map((c) => c.no),
      channels: nextChannels
    });
  } catch (error) {
    console.error('Channel configuration error:', error);
    const status = error.message.startsWith('Invalid ') || error.message === 'URL is too long' ? 400 : 500;
    return response.status(status).json({
      error: status === 400 ? error.message : 'Unable to access channel configuration database'
    });
  } finally {
    if (redis.isOpen) await redis.quit();
  }
}

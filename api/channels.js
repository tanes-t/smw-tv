/* global process */
import { createClient } from 'redis';

const CONFIG_KEY = 'smw-tv:channel-configs-v2';

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

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (!process.env.REDIS_URL) {
    return response.status(503).json({
      error: 'Redis is not configured. Connect the Vercel Redis store first.'
    });
  }

  const redis = getRedisClient();
  try {
    await redis.connect();
    const stored = await redis.get(CONFIG_KEY);
    const channels = stored ? JSON.parse(stored) : [];

    if (request.method === 'GET') {
      return response.status(200).json({ channels });
    }

    if (request.method !== 'PUT' && request.method !== 'POST') {
      response.setHeader('Allow', 'GET, PUT, POST');
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
    // Replace full channel list with updated list
    const nextChannels = updates.sort((a, b) => a.no.localeCompare(b.no, undefined, { numeric: true }));

    await redis.set(CONFIG_KEY, JSON.stringify(nextChannels));
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

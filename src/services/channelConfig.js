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
    return Array.isArray(payload.channels) ? payload.channels : [];
  } finally {
    clearTimeout(timer);
  }
}

export async function saveRemoteChannelConfig(channels) {
  const response = await fetch('/api/channels', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channels })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Configuration API HTTP ${response.status}`);
  }
  return response.json();
}

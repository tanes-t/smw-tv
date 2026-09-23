const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

function getYouTubeHost(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function isYouTubeUrl(url) {
  return YOUTUBE_HOSTS.has(getYouTubeHost(url));
}

export function getYouTubeVideoId(url) {
  if (!isYouTubeUrl(url)) return '';

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host === 'youtu.be' || host === 'www.youtu.be') {
      return parsed.pathname.slice(1).split('/')[0];
    }

    if (parsed.pathname.startsWith('/embed/')) {
      return parsed.pathname.split('/')[2] || '';
    }

    if (parsed.pathname.startsWith('/shorts/')) {
      return parsed.pathname.split('/')[2] || '';
    }

    if (parsed.pathname === '/live' || parsed.pathname.startsWith('/live/')) {
      return parsed.pathname.split('/')[2] || parsed.searchParams.get('v') || '';
    }

    return parsed.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

export function getYouTubeEmbedUrl(url) {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return url;

  const params = new URLSearchParams({
    autoplay: '1',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
  });

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params}`;
}

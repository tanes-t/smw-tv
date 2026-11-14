import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import Gallery from './gallery/Gallery';
import Stage from './stage/Stage';
import type { AppConfig, Channel } from './types';
import { DEFAULT_TV_CHANNELS } from './config/tvChannels';
import './styles/tv.css';

const SettingsModal = lazy(() => import('./components/SettingsModal'));

const LS_KEY = 'smw_tv_channels_v2';

function getDefaultChannels(): Channel[] {
  return DEFAULT_TV_CHANNELS.map((c) => ({
    id: parseInt(c.no, 10),
    no: c.no,
    key: c.key,
    name: c.name,
    category: c.category || 'Factory',
    type: (c.view || c.streamType || 'dashboard') as any,
    view: c.view,
    url: c.streamUrl || c.apiUrl || '',
    streamUrl: c.streamUrl,
    apiUrl: c.apiUrl,
    apiAction: c.apiAction || 'getTVData',
    refreshMin: 3,
    enabled: c.enabled !== false,
    thumbnail: c.thumbnail,
    description: c.description,
    hasData: c.hasData,
  }));
}

const DEFAULT_CONFIG: AppConfig = {
  version: 2,
  updatedAt: new Date().toISOString(),
  channels: getDefaultChannels(),
};

function loadLocal(): AppConfig {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {
        version: 2,
        updatedAt: new Date().toISOString(),
        channels: parsed.map((c) => ({
          ...c,
          id: typeof c.id === 'number' ? c.id : parseInt(c.no, 10) || 1,
          type: c.type || c.view || 'dashboard',
          url: c.url || c.streamUrl || c.apiUrl || '',
        })),
      };
    }
    if (parsed.channels) {
      return parsed as AppConfig;
    }
    return DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function fetchRemote(): Promise<AppConfig | null> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch('/api/channels', { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data)) {
      return {
        version: Date.now(),
        updatedAt: new Date().toISOString(),
        channels: data.map((c) => ({
          ...c,
          id: typeof c.id === 'number' ? c.id : parseInt(c.no, 10) || 1,
          type: c.type || c.view || 'dashboard',
          url: c.url || c.streamUrl || c.apiUrl || '',
        })),
      };
    }
    return data as AppConfig;
  } catch {
    return null; // offline fallback
  } finally {
    window.clearTimeout(t);
  }
}

type Mode = { kind: 'gallery' } | { kind: 'stage'; id: number };

export default function App() {
  const [config, setConfig] = useState<AppConfig>(loadLocal);
  const [mode, setMode] = useState<Mode>({ kind: 'gallery' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const lastFocused = useRef<number | undefined>(undefined);

  // Background sync from remote API
  useEffect(() => {
    let alive = true;
    fetchRemote().then((remote) => {
      if (!alive || !remote) return;
      setConfig((cur) => {
        if (remote.version <= cur.version) return cur;
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(remote.channels));
        } catch {
          /* ignore */
        }
        return remote;
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  const openStage = useCallback((id: number) => {
    if (id === 20) {
      setIsSettingsOpen(true);
      return;
    }
    setMode({ kind: 'stage', id });
  }, []);

  const backToGallery = useCallback(() => setMode({ kind: 'gallery' }), []);
  const onFocusId = useCallback((id: number) => {
    lastFocused.current = id;
  }, []);

  const handleSaveSettings = useCallback((updatedChannels: any[]) => {
    const formatted = updatedChannels.map((c) => ({
      ...c,
      id: typeof c.id === 'number' ? c.id : parseInt(c.no, 10) || 1,
      type: c.type || c.view || 'dashboard',
      url: c.url || c.streamUrl || c.apiUrl || '',
    }));
    const newConfig: AppConfig = {
      version: Date.now(),
      updatedAt: new Date().toISOString(),
      channels: formatted,
    };
    setConfig(newConfig);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(formatted));
    } catch {
      /* ignore */
    }
    setIsSettingsOpen(false);
  }, []);

  return (
    <>
      {mode.kind === 'gallery' ? (
        <Gallery
          channels={config.channels}
          lastFocusedId={lastFocused.current}
          onSelect={openStage}
          onFocusId={onFocusId}
        />
      ) : (
        <Stage
          channels={config.channels}
          activeId={mode.id}
          onSwitch={openStage}
          onExit={backToGallery}
        />
      )}

      {isSettingsOpen && (
        <Suspense fallback={null}>
          <SettingsModal
            channels={config.channels}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSaveSettings}
          />
        </Suspense>
      )}
    </>
  );
}

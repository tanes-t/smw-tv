import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTVNavigation } from './hooks/useTVNavigation';
import SettingsModal from './components/SettingsModal';
import ChannelDashboard from './components/ChannelDashboard';
import {
  DEFAULT_REFRESH_INTERVAL_MINUTES,
  TV_CHANNELS,
  getChannelApiRequestUrl,
  getChannelStorageKey,
  getChannelStreamStorageKey,
  getChannelViewTypeStorageKey,
  getStoredChannelApiUrl,
  getStoredStreamUrl,
  getStoredChannelViewType,
  isSettingsChannel
} from './config/tvChannels';

const CONTENT_ITEMS = 6;

export default function App() {
  const [activeChannelIdx, setActiveChannelIdx] = useState(0);
  const [isChannelMenuOpen, setIsChannelMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [clockTime, setClockTime] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncToken, setLastSyncToken] = useState(null);

  // Channel API URLs, Stream URLs, View Types & API Data Map
  const [channelApiUrls, setChannelApiUrls] = useState(() => (
    TV_CHANNELS.reduce((acc, channel) => {
      acc[channel.no] = getStoredChannelApiUrl(channel);
      return acc;
    }, {})
  ));

  const [channelStreamUrls, setChannelStreamUrls] = useState(() => (
    TV_CHANNELS.reduce((acc, channel) => {
      acc[channel.no] = getStoredStreamUrl(channel);
      return acc;
    }, {})
  ));

  const [channelViewTypes, setChannelViewTypes] = useState(() => (
    TV_CHANNELS.reduce((acc, channel) => {
      acc[channel.no] = getStoredChannelViewType(channel);
      return acc;
    }, {})
  ));

  const [channelDataMap, setChannelDataMap] = useState({});

  const [refreshInterval, setRefreshInterval] = useState(() => {
    const saved = localStorage.getItem('smw_tv_refresh_interval');
    return saved ? parseInt(saved) : DEFAULT_REFRESH_INTERVAL_MINUTES;
  });

  const [pixelShift, setPixelShift] = useState(0);

  const activeChannel = TV_CHANNELS[activeChannelIdx];
  const apiUrl = channelApiUrls[activeChannel.no] || activeChannel.apiUrl || '';
  const streamUrl = channelStreamUrls[activeChannel.no] || activeChannel.streamUrl || apiUrl;
  const currentViewType = channelViewTypes[activeChannel.no] || activeChannel.view || 'dashboard';
  const playableChannels = useMemo(() => TV_CHANNELS.filter((channel) => !isSettingsChannel(channel)), []);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  }, []);

  const selectChannel = useCallback((idx) => {
    const selectedChannel = TV_CHANNELS[idx];
    if (isSettingsChannel(selectedChannel)) {
      setIsSettingsOpen(true);
      return;
    }

    setActiveChannelIdx(idx);
    setIsChannelMenuOpen(false);
    showToast(`กำลังเปิด CH ${selectedChannel.no}: ${selectedChannel.name}`);
  }, [showToast]);

  const {
    zone,
    sidebarIndex,
    contentIndex,
    settingsIndex,
    setZone,
    setSidebarIndex
  } = useTVNavigation({
    sidebarCount: TV_CHANNELS.length,
    contentCount: CONTENT_ITEMS,
    onSelectChannel: selectChannel,
    onOpenChannelMenu: () => setIsChannelMenuOpen(true),
    onCloseChannelMenu: () => setIsChannelMenuOpen(false),
    isChannelMenuOpen,
    isSettingsOpen
  });

  // Fetch API data for active channel
  const fetchChannelData = useCallback(async (isSilent = false) => {
    // If the channel is pure iframe or settings, don't fetch JSON API unless configured
    if (isSettingsChannel(activeChannel)) return;

    const requestUrl = getChannelApiRequestUrl(activeChannel, apiUrl);
    if (!requestUrl) return;

    if (!isSilent) setLoading(true);

    try {
      const response = await fetch(requestUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (!result.success && !result.kpi && !result.metrics) {
        throw new Error(result.error || 'API response format invalid');
      }

      // Save live API data into state for this channel
      setChannelDataMap((prev) => ({
        ...prev,
        [activeChannel.no]: result
      }));

      const configToken = result.kpi?.dashConfig?.refreshTrigger;
      if (configToken && lastSyncToken && configToken !== lastSyncToken) {
        showToast('ได้รับสัญญาณ refresh จากระบบส่วนกลาง');
      }

      setLastSyncToken(configToken || lastSyncToken);
      setIsOnline(true);
      setError(null);
    } catch (err) {
      console.warn(`Fetch error for CH ${activeChannel.no}:`, err);
      // Keep previous data if already cached, don't blank out screen
      setError(`เชื่อมต่อ API ไม่ได้: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [activeChannel, apiUrl, lastSyncToken, showToast]);

  // Clock ticker
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const pad = (v) => String(v).padStart(2, '0');
      setClockTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data on active channel change or interval
  useEffect(() => {
    const initialFetch = setTimeout(() => fetchChannelData(), 0);
    const interval = setInterval(() => fetchChannelData(true), refreshInterval * 60 * 1000);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [fetchChannelData, refreshInterval]);

  // Pixel shift for OLED/Burn-in protection
  useEffect(() => {
    const shiftInterval = setInterval(() => {
      setPixelShift((prev) => (prev + 1) % 5);
    }, 5 * 60 * 1000);

    return () => clearInterval(shiftInterval);
  }, []);

  // Auto-scroll focused item in sidebar
  useEffect(() => {
    if (zone === 'sidebar') {
      const activeEl = document.getElementById(`stream-item-${sidebarIndex}`);
      activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [sidebarIndex, zone]);

  // Handle Save Settings from Settings Modal
  const handleSaveSettings = ({
    channelNo,
    apiUrl: newApiUrl,
    streamUrl: newStreamUrl,
    viewType: newViewType,
    refreshInterval: newInterval,
    applyToAll
  }) => {
    if (applyToAll) {
      // Apply API URL and interval to all playable channels
      const updatedApis = {};
      const updatedStreams = {};
      const updatedViews = {};

      playableChannels.forEach((ch) => {
        updatedApis[ch.no] = newApiUrl;
        updatedStreams[ch.no] = newStreamUrl || newApiUrl;
        updatedViews[ch.no] = ch.no === '01' ? 'iframe' : newViewType;

        localStorage.setItem(getChannelStorageKey(ch.no), newApiUrl);
        localStorage.setItem(getChannelStreamStorageKey(ch.no), newStreamUrl || newApiUrl);
        localStorage.setItem(getChannelViewTypeStorageKey(ch.no), updatedViews[ch.no]);
      });

      setChannelApiUrls((prev) => ({ ...prev, ...updatedApis }));
      setChannelStreamUrls((prev) => ({ ...prev, ...updatedStreams }));
      setChannelViewTypes((prev) => ({ ...prev, ...updatedViews }));
      showToast('บันทึกการตั้งค่า API ให้กับทุกช่องแล้ว');
    } else {
      // Save for selected channel
      setChannelApiUrls((prev) => ({
        ...prev,
        [channelNo]: newApiUrl
      }));
      setChannelStreamUrls((prev) => ({
        ...prev,
        [channelNo]: newStreamUrl
      }));
      setChannelViewTypes((prev) => ({
        ...prev,
        [channelNo]: newViewType
      }));

      localStorage.setItem(getChannelStorageKey(channelNo), newApiUrl);
      localStorage.setItem(getChannelStreamStorageKey(channelNo), newStreamUrl);
      localStorage.setItem(getChannelViewTypeStorageKey(channelNo), newViewType);
      showToast(`บันทึกการตั้งค่า CH ${channelNo} แล้ว`);
    }

    setRefreshInterval(newInterval);
    localStorage.setItem('smw_tv_refresh_interval', newInterval.toString());
    setIsSettingsOpen(false);

    // Trigger re-fetch for active channel
    setTimeout(() => {
      fetchChannelData(false);
    }, 100);
  };

  const simulateKeyPress = (keyName) => {
    const event = new KeyboardEvent('keydown', { key: keyName });
    window.dispatchEvent(event);
  };

  const pixelShiftClass = pixelShift > 0 ? `pixel-shift-${pixelShift}` : '';
  const currentChannelData = channelDataMap[activeChannel.no];
  const hasLiveChannelData = Boolean(currentChannelData && (currentChannelData.success || currentChannelData.kpi));

  return (
    <div className={`streaming-layout ${isChannelMenuOpen ? 'menu-open' : ''} ${pixelShiftClass}`}>
      {!isOnline && (
        <div className="network-status-alert">
          <div className="reconnect-spinner"></div>
          <span>{error || 'กำลังเชื่อมต่อแหล่งข้อมูลใหม่'}</span>
        </div>
      )}

      {isChannelMenuOpen && (
        <button
          className="channel-menu-backdrop"
          aria-label="Close channel menu"
          onClick={() => setIsChannelMenuOpen(false)}
        />
      )}

      <aside className="stream-sidebar">
        <button className="brand-button" onClick={() => setIsSettingsOpen(true)}>
          <img
            src="https://raw.githubusercontent.com/tanes-t/smw-assets/main/smw_logo.png"
            alt="SMW Logo"
            className="tv-logo"
          />
          <span>
            <strong>SMW STREAM</strong>
            <small>Google TV • Multi-Channel API</small>
          </span>
        </button>

        <div className="rail-title">Live Channels</div>
        <div className="stream-list">
          {TV_CHANNELS.map((channel, idx) => {
            const isFocused = zone === 'sidebar' && sidebarIndex === idx;
            const isActive = activeChannelIdx === idx;
            const hasDataActive = Boolean(channelDataMap[channel.no] || channelApiUrls[channel.no] || channel.hasData);

            return (
              <button
                key={channel.key}
                id={`stream-item-${idx}`}
                className={`stream-item ${isFocused ? 'focused' : ''} ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setSidebarIndex(idx);
                  setZone('sidebar');
                  selectChannel(idx);
                }}
              >
                <span className="stream-number">{channel.no}</span>
                <span className="stream-copy">
                  <strong>{channel.name}</strong>
                  <small>{channel.category}</small>
                </span>
                <span className={`live-dot ${hasDataActive ? 'ready' : ''}`}></span>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="stream-stage">
        <button className="channel-menu-trigger" onClick={() => setIsChannelMenuOpen(true)}>
          CH MENU
        </button>

        <header className="stream-header">
          <div>
            <span className="eyebrow">CH {activeChannel.no} / {activeChannel.category}</span>
            <h1>{activeChannel.name}</h1>
          </div>
          <div className="clock-block">
            <strong>{clockTime}</strong>
            <span>{loading ? 'SYNCING' : hasLiveChannelData ? 'LIVE API' : activeChannel.hasData ? 'LIVE' : 'READY'}</span>
          </div>
        </header>

        <section className={`player-shell ${zone === 'content' && contentIndex === 0 ? 'focused' : ''}`}>
          {currentViewType === 'iframe' && streamUrl ? (
            <iframe
              src={streamUrl}
              title={activeChannel.name}
              allow="autoplay; fullscreen"
              className="stream-frame"
            />
          ) : currentViewType === 'video' && streamUrl ? (
            <video className="stream-frame" src={streamUrl} controls autoPlay muted playsInline />
          ) : (
            <ChannelDashboard
              channel={activeChannel}
              data={currentChannelData}
              apiUrl={apiUrl}
              isLoading={loading}
              error={error}
              focusIndex={contentIndex}
              focusZone={zone}
            />
          )}

          <div className="player-overlay">
            <span>{activeChannel.category}</span>
            <strong>{activeChannel.name}</strong>
          </div>
        </section>

        <section className="content-rail">
          {playableChannels.slice(0, 5).map((channel, idx) => (
            <button
              key={channel.key}
              className={`rail-card ${zone === 'content' && contentIndex === idx + 1 ? 'focused' : ''} ${activeChannel.key === channel.key ? 'active' : ''}`}
              onClick={() => selectChannel(TV_CHANNELS.findIndex((item) => item.key === channel.key))}
            >
              <span>{channel.category}</span>
              <strong>{channel.name}</strong>
              <small>{channel.description}</small>
            </button>
          ))}
        </section>

        <footer className="stream-footer">
          <span>{activeChannel.description}</span>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button className="footer-action" onClick={() => fetchChannelData(false)}>
              🔄 REFRESH
            </button>
            <button className="footer-action" onClick={() => setIsSettingsOpen(true)}>
              ⚙️ SETTINGS
            </button>
          </div>
        </footer>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        currentChannelNo={activeChannel.no}
        currentInterval={refreshInterval}
        focusIndex={settingsIndex}
      />

      {toastMessage && <div className="tv-toast">{toastMessage}</div>}

      <div className="virtual-remote">
        <span className="remote-title">Remote</span>
        <button className="remote-menu-btn" onClick={() => simulateKeyPress('Menu')}>CH MENU</button>
        <div className="remote-row">
          <button className="remote-btn" onClick={() => simulateKeyPress('ArrowUp')}>▲</button>
        </div>
        <div className="remote-row">
          <button className="remote-btn" onClick={() => simulateKeyPress('ArrowLeft')}>◀</button>
          <button className="remote-btn enter-btn" onClick={() => simulateKeyPress('Enter')}>OK</button>
          <button className="remote-btn" onClick={() => simulateKeyPress('ArrowRight')}>▶</button>
        </div>
        <div className="remote-row">
          <button className="remote-btn" onClick={() => simulateKeyPress('ArrowDown')}>▼</button>
        </div>
      </div>
    </div>
  );
}

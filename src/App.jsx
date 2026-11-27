import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { useTVNavigation } from './hooks/useTVNavigation';
const SettingsModal = lazy(() => import('./components/SettingsModal'));
import SettingsIcon from './components/SettingsIcon';
import {
  HomeIcon,
  MenuIcon,
  RefreshIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowLeftSmallIcon
} from './components/Icons';
import LiveStageContainer from './components/LiveStageContainer';
import NetflixGallery from './components/NetflixGallery';
import IntroMotion from './components/IntroMotion';
import {
  DEFAULT_REFRESH_INTERVAL_MINUTES,
  loadCustomChannels,
  saveCustomChannels,
  getChannelApiRequestUrl,
  isSettingsChannel,
  DEFAULT_TV_CHANNELS,
  SETTINGS_CHANNEL_NO
} from './config/tvChannels';
import { getYouTubeEmbedUrl, isYouTubeUrl } from './utils/youtube';
import { loadRemoteChannelConfig, saveRemoteChannelConfig } from './services/channelConfig';

const CONTENT_ITEMS = 6;

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' | 'live'
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const lastSyncTokenRef = useRef(null);
  const fetchAbortRef = useRef(null);
  const retryTimerRef = useRef(null);
  const fetchChannelDataRef = useRef(null);
  const [channels, setChannels] = useState(() => loadCustomChannels());
  const [activeChannelIdx, setActiveChannelIdx] = useState(0);
  const [isChannelMenuOpen, setIsChannelMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [clockTime, setClockTime] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [channelDataMap, setChannelDataMap] = useState({});

  const [refreshInterval, setRefreshInterval] = useState(() => {
    const saved = localStorage.getItem('smw_tv_refresh_interval');
    return saved ? parseInt(saved) : DEFAULT_REFRESH_INTERVAL_MINUTES;
  });

  const [pixelShift, setPixelShift] = useState(0);
  const [remoteDigitOsd, setRemoteDigitOsd] = useState('');
  const remoteDigitBufferRef = useRef('');
  const remoteDigitTimerRef = useRef(null);
  const remoteOsdTimerRef = useRef(null);

  const safeActiveIndex = Math.min(Math.max(0, activeChannelIdx), Math.max(0, channels.length - 1));
  const activeChannel = useMemo(() => {
    return channels[safeActiveIndex] || channels[0] || {
      no: '01',
      name: 'Standby Channel',
      category: 'Factory',
      description: 'ระบบสแตนด์บาย',
      view: 'dashboard'
    };
  }, [channels, safeActiveIndex]);

  const apiUrl = activeChannel.apiUrl || '';
  const streamUrl = activeChannel.streamUrl || apiUrl;
  const isYouTubeStream = isYouTubeUrl(streamUrl);
  const playerUrl = isYouTubeStream ? getYouTubeEmbedUrl(streamUrl) : streamUrl;
  const effectiveViewType = activeChannel.view || 'dashboard';

  const playableChannels = useMemo(() => {
    return channels.filter((channel) => !isSettingsChannel(channel) && channel.enabled !== false);
  }, [channels]);

  const getChannelName = useCallback((channel) => channel?.name || '', []);

  // Reset auto-hide timer for controls during live playback
  const resetControlsTimeout = useCallback(() => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    // Only auto-hide in 'live' mode when menus/settings are closed
    if (viewMode === 'live' && !isChannelMenuOpen && !isSettingsOpen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 3500);
    }
  }, [viewMode, isChannelMenuOpen, isSettingsOpen]);

  // Activity listeners to show controls and reset auto-hide timeout
  useEffect(() => {
    if (viewMode !== 'live') {
      const showTimer = setTimeout(() => setIsControlsVisible(true), 0);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      return () => clearTimeout(showTimer);
    }

    const handleUserActivity = () => {
      resetControlsTimeout();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('wheel', handleUserActivity);

    // Initial timeout when entering live mode
    const initTimer = setTimeout(resetControlsTimeout, 0);

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('wheel', handleUserActivity);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [viewMode, resetControlsTimeout]);

  useEffect(() => {
    let cancelled = false;
    loadRemoteChannelConfig()
      .then((configs) => {
        if (cancelled || !configs || !configs.length) return;
        setChannels((prev) => {
          const merged = configs.map(rc => {
            const no = rc.no || rc.channel_no;
            const existing = prev.find(p => p.no === no);
            return {
              no,
              key: rc.key || `channel-${no}`,
              name: rc.name || rc.channel_name || `CH ${no}`,
              category: rc.category || existing?.category || 'Factory',
              description: rc.description || existing?.description || '',
              apiUrl: rc.apiUrl || rc.api_url || '',
              streamUrl: rc.streamUrl || rc.stream_url || '',
              view: rc.view || rc.view_type || 'dashboard',
              streamType: rc.streamType || rc.view_type || 'dashboard',
              thumbnail: rc.thumbnail || existing?.thumbnail || '/graphics/ch01_production.svg',
              enabled: existing ? existing.enabled !== false : rc.enabled !== false,
              hasData: Boolean(rc.apiUrl || rc.api_url),
              apiAction: rc.apiAction || existing?.apiAction || 'getTVData'
            };
          });

          // Ensure settings channel 20 is always present
          const hasSettings = merged.some(c => c.no === SETTINGS_CHANNEL_NO);
          if (!hasSettings) {
            const defaultSettings = DEFAULT_TV_CHANNELS.find(c => c.no === SETTINGS_CHANNEL_NO);
            if (defaultSettings) merged.push(defaultSettings);
          }

          saveCustomChannels(merged);
          return merged;
        });
      })
      .catch(() => {
        // Local storage remains the offline fallback when the database is not connected.
      });
    return () => { cancelled = true; };
  }, []);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  }, []);

  const selectChannel = useCallback((idx) => {
    const selectedChannel = channels[idx];
    if (!selectedChannel) return;

    if (isSettingsChannel(selectedChannel)) {
      setIsSettingsOpen(true);
      return;
    }

    setActiveChannelIdx(idx);
    setViewMode('live');
    setIsChannelMenuOpen(false);
    resetControlsTimeout();
    showToast(`กำลังเปิด CH ${selectedChannel.no}: ${selectedChannel.name}`);
  }, [channels, showToast, resetControlsTimeout]);

  // Direct tuning by channel number string
  const tuneToChannelNumber = useCallback((numStr) => {
    const formatted = String(numStr).padStart(2, '0');
    const targetIdx = channels.findIndex(c => c.no === formatted || c.no === numStr);
    if (targetIdx !== -1) {
      selectChannel(targetIdx);
    } else {
      showToast(`ไม่พบช่องหมายเลข CH ${formatted}`);
    }
  }, [channels, selectChannel, showToast]);

  // Cycle channel up or down (ChannelUp / ChannelDown buttons on TV remote)
  const cycleChannel = useCallback((direction) => {
    if (!playableChannels.length) return;
    const currentPlayableIdx = playableChannels.findIndex(c => c.no === activeChannel.no);
    const safeIdx = currentPlayableIdx === -1 ? 0 : currentPlayableIdx;
    const nextIdx = (safeIdx + direction + playableChannels.length) % playableChannels.length;
    const targetChannel = playableChannels[nextIdx];
    if (targetChannel) {
      const fullIdx = channels.findIndex(c => c.no === targetChannel.no);
      if (fullIdx !== -1) selectChannel(fullIdx);
    }
  }, [playableChannels, activeChannel, channels, selectChannel]);

  // Global key listener for TV Remote (Back, Digits 0-9, CH+/CH-, Settings)
  useEffect(() => {
    const handleGlobalRemote = (e) => {
      const targetTag = e.target?.tagName;
      const isInput = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT' || e.target?.isContentEditable;

      // When typing inside any text input or editable element, NEVER intercept keys as remote navigation!
      if (isInput) {
        if (e.key === 'Backspace' || e.key === 'Delete') return;
        return;
      }

      resetControlsTimeout();

      // Direct Number keys (0-9) on TV Remote for instant channel switching
      if (!isSettingsOpen && e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        if (remoteDigitTimerRef.current) clearTimeout(remoteDigitTimerRef.current);
        if (remoteOsdTimerRef.current) clearTimeout(remoteOsdTimerRef.current);

        const nextBuffer = (remoteDigitBufferRef.current + e.key).slice(-2);
        remoteDigitBufferRef.current = nextBuffer;
        setRemoteDigitOsd(nextBuffer);

        if (nextBuffer.length >= 2) {
          tuneToChannelNumber(nextBuffer);
          remoteDigitBufferRef.current = '';
          remoteOsdTimerRef.current = setTimeout(() => setRemoteDigitOsd(''), 900);
        } else {
          remoteDigitTimerRef.current = setTimeout(() => {
            if (remoteDigitBufferRef.current) {
              tuneToChannelNumber(remoteDigitBufferRef.current);
              remoteDigitBufferRef.current = '';
              remoteOsdTimerRef.current = setTimeout(() => setRemoteDigitOsd(''), 900);
            }
          }, 1100);
        }
        return;
      }

      // ChannelUp / ChannelDown / PageUp / PageDown keys on TV Remote
      if (!isSettingsOpen && (e.key === 'ChannelUp' || e.key === 'PageUp')) {
        e.preventDefault();
        cycleChannel(1);
        return;
      }
      if (!isSettingsOpen && (e.key === 'ChannelDown' || e.key === 'PageDown')) {
        e.preventDefault();
        cycleChannel(-1);
        return;
      }

      // Quick Settings button ('s' / 'S' / 'Settings')
      if (!isSettingsOpen && (e.key === 's' || e.key === 'S' || e.key === 'Settings')) {
        e.preventDefault();
        setIsSettingsOpen(true);
        return;
      }

      // In Settings modal: ONLY Escape or physical TV remote Back key closes the modal (never Backspace)
      if (isSettingsOpen) {
        if (e.key === 'Escape' || e.key === 'Back') {
          setIsSettingsOpen(false);
          e.preventDefault();
        }
        return;
      }

      // Outside Settings modal: Escape or Back (or Backspace when not in an input)
      if (e.key === 'Escape' || e.key === 'Back' || e.key === 'Backspace') {
        if (isChannelMenuOpen) {
          setIsChannelMenuOpen(false);
          e.preventDefault();
        } else if (viewMode === 'live') {
          setViewMode('gallery');
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalRemote);
    return () => window.removeEventListener('keydown', handleGlobalRemote);
  }, [isSettingsOpen, isChannelMenuOpen, viewMode, resetControlsTimeout, tuneToChannelNumber, cycleChannel]);

  const {
    zone,
    sidebarIndex,
    contentIndex,
    setZone,
    setSidebarIndex
  } = useTVNavigation({
    enabled: viewMode === 'live' && !isSettingsOpen,
    sidebarCount: channels.length,
    contentCount: CONTENT_ITEMS,
    onSelectChannel: selectChannel,
    onOpenChannelMenu: () => setIsChannelMenuOpen(true),
    onCloseChannelMenu: () => setIsChannelMenuOpen(false),
    isChannelMenuOpen,
    isSettingsOpen
  });

  // Fetch API data for active channel (with AbortController, 12s timeout, and 1 auto-retry)
  const fetchChannelData = useCallback(async (isSilent = false, isRetry = false) => {
    // If the channel is pure iframe or settings, don't fetch JSON API unless configured
    if (isSettingsChannel(activeChannel)) return;
    if (effectiveViewType === 'iframe' && streamUrl) return;

    const requestUrl = getChannelApiRequestUrl(activeChannel, apiUrl);
    if (!requestUrl) return;

    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const controller = new AbortController();
    fetchAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    if (!isSilent) setLoading(true);

    try {
      const response = await fetch(requestUrl, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (!result.success && !result.kpi && !result.metrics && !result.planning) {
        throw new Error(result.error || 'API response format invalid');
      }

      // Save live API data into state for this channel
      setChannelDataMap((prev) => ({
        ...prev,
        [activeChannel.no]: result
      }));

      const configToken = result.kpi?.dashConfig?.refreshTrigger;
      if (configToken && lastSyncTokenRef.current && configToken !== lastSyncTokenRef.current) {
        showToast('ได้รับสัญญาณ refresh จากระบบส่วนกลาง');
      }

      lastSyncTokenRef.current = configToken || lastSyncTokenRef.current;
      setIsOnline(true);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError' && fetchAbortRef.current !== controller) {
        // Cancelled because user switched to another channel; ignore cleanly
        return;
      }
      const errMsg = err.name === 'AbortError' ? 'การเชื่อมต่อหมดเวลา (Timeout)' : err.message;
      console.warn(`Fetch error for CH ${activeChannel.no}:`, errMsg);
      setError(`เชื่อมต่อ API ไม่ได้: ${errMsg}`);
      if (!isRetry) {
        retryTimerRef.current = setTimeout(() => {
          fetchChannelDataRef.current?.(true, true);
        }, 2000);
      }
    } finally {
      clearTimeout(timeoutId);
      if (fetchAbortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [activeChannel, apiUrl, effectiveViewType, streamUrl, showToast]);

  useEffect(() => {
    fetchChannelDataRef.current = fetchChannelData;
  }, [fetchChannelData]);

  // Clock ticker (updates only when HH:MM changes to avoid unnecessary gallery re-renders)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const pad = (v) => String(v).padStart(2, '0');
      const nextTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setClockTime((prev) => (prev === nextTime ? prev : nextTime));
    };

    tick();
    const interval = setInterval(tick, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data on active channel change or interval
  useEffect(() => {
    const initialFetch = setTimeout(() => fetchChannelData(), 0);
    const interval = setInterval(() => fetchChannelData(true), refreshInterval * 60 * 1000);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [fetchChannelData, refreshInterval]);

  // Pixel shift for OLED/Burn-in protection
  useEffect(() => {
    const shiftInterval = setInterval(() => {
      setPixelShift((prev) => (prev + 1) % 5);
    }, 5 * 60 * 1000);

    return () => clearInterval(shiftInterval);
  }, []);

  // Auto-scroll focused item in sidebar or content rail when TV remote navigates (instant for TV)
  useEffect(() => {
    if (zone === 'sidebar') {
      const activeEl = document.getElementById(`stream-item-${sidebarIndex}`);
      activeEl?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    } else if (zone === 'content') {
      const activeEl = document.querySelector('.rail-card.focused, .tv-card.focused, .tv-table-row.focused');
      activeEl?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }
  }, [sidebarIndex, contentIndex, zone]);

  // Handle Save Settings from Settings Modal
  const handleSaveChannels = ({ channels: updatedChannels, refreshInterval: newInterval }) => {
    setChannels(updatedChannels);
    saveCustomChannels(updatedChannels);
    setRefreshInterval(newInterval);
    localStorage.setItem('smw_tv_refresh_interval', newInterval.toString());
    setIsSettingsOpen(false);
    showToast('บันทึกการตั้งค่าช่องทั้งหมดเรียบร้อยแล้ว');

    saveRemoteChannelConfig(updatedChannels).catch(() => {
      // Local storage fallback remains reliable
    });

    // Trigger re-fetch for active channel
    setTimeout(() => {
      fetchChannelData(false);
    }, 150);
  };

  const simulateKeyPress = (keyName) => {
    resetControlsTimeout();
    const event = new KeyboardEvent('keydown', { key: keyName, bubbles: true, cancelable: true });
    window.dispatchEvent(event);
  };

  const pixelShiftClass = pixelShift > 0 ? `pixel-shift-${pixelShift}` : '';
  const currentChannelData = channelDataMap[activeChannel.no];
  const hasLiveChannelData = Boolean(currentChannelData && (currentChannelData.success || currentChannelData.kpi));

  return (
    <>
      {showIntro && (
        <IntroMotion onComplete={() => setShowIntro(false)} />
      )}

      {viewMode === 'gallery' ? (
        <NetflixGallery
          channels={channels.filter(c => c.enabled !== false)}
          activeChannelIdx={safeActiveIndex}
          onSelectChannel={(target) => {
            let ch = null;
            if (target && typeof target === 'object' && target.no) {
              ch = target;
            } else if (typeof target === 'number') {
              const enabledList = channels.filter(c => c.enabled !== false);
              ch = enabledList[target] || channels[target];
            }
            if (ch && ch.no) {
              const fullIdx = channels.findIndex(c => c.no === ch.no);
              if (fullIdx !== -1) selectChannel(fullIdx);
            }
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onReplayIntro={() => setShowIntro(true)}
          clockTime={clockTime}
          channelDataMap={channelDataMap}
          isOnline={isOnline}
        />
      ) : (
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

            <button
              id="stream-item-home"
              className={`stream-item stream-home-btn ${zone === 'sidebar' && sidebarIndex === -1 ? 'focused' : ''}`}
              onClick={() => {
                setViewMode('gallery');
                setIsChannelMenuOpen(false);
              }}
            >
              <span className="stream-number"><HomeIcon size={20} /></span>
              <span className="stream-copy">
                <strong>หน้าแรก (แกลอรี่)</strong>
                <small>แกลอรี่ช่อง SMW</small>
              </span>
            </button>

            <div className="rail-title">Live Channels</div>
            <div className="stream-list">
              {channels.map((channel, idx) => {
                const isFocused = zone === 'sidebar' && sidebarIndex === idx;
                const isActive = activeChannel.no === channel.no;
                const hasDataActive = Boolean(channelDataMap[channel.no] || channel.apiUrl || channel.hasData);
                const isVisible = channel.enabled !== false;

                return (
                  <button
                    key={channel.key || channel.no}
                    id={`stream-item-${idx}`}
                    className={`stream-item ${isFocused ? 'focused' : ''} ${isActive ? 'active' : ''} ${!isVisible ? 'muted-channel' : ''}`}
                    onClick={() => {
                      setSidebarIndex(idx);
                      setZone('sidebar');
                      selectChannel(idx);
                    }}
                  >
                    <span className={`stream-number ${isSettingsChannel(channel) ? 'settings-channel-icon' : ''}`}>
                      {isSettingsChannel(channel) ? <SettingsIcon size={22} /> : channel.no}
                    </span>
                    <span className="stream-copy">
                      <strong>{getChannelName(channel)}</strong>
                      <small>{channel.category}</small>
                    </span>
                    <span className={`live-dot ${hasDataActive ? 'ready' : ''}`}></span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className={`stream-stage ${!isControlsVisible ? 'controls-hidden' : ''}`}>
            {/* Top sensor to wake controls immediately when hovering near top edge */}
            <div className="stream-top-sensor" onMouseEnter={resetControlsTimeout} />

            {/* Unified TV Header Bar (Rearranged & non-overlapping) */}
            <header className={`stream-top-bar ${!isControlsVisible ? 'hidden' : ''}`} onMouseEnter={resetControlsTimeout}>
              <div className="top-bar-left">
                <button
                  className="top-bar-btn gallery-btn"
                  onClick={() => setViewMode('gallery')}
                  title="กลับสู่หน้าแกลอรี่"
                >
                  <span className="btn-icon"><ArrowLeftIcon size={16} /></span>
                  <span>หน้าแรก (แกลอรี่)</span>
                </button>

                <button
                  className="top-bar-btn channel-menu-btn"
                  onClick={() => setIsChannelMenuOpen(true)}
                  title="เปิดเมนูเลือกช่อง (กด ☰ หรือ Menu บนรีโมท)"
                >
                  <span className="btn-icon"><MenuIcon size={16} /></span>
                  <span>รายการช่อง</span>
                </button>
              </div>

              <div className="top-bar-center">
                <div className="channel-badge-chip">
                  <span className="channel-chip-no">CH {activeChannel.no}</span>
                  <span className="channel-chip-divider">•</span>
                  <span className="channel-chip-name">{getChannelName(activeChannel)}</span>
                  <span className="channel-chip-tag">{activeChannel.category}</span>
                </div>
              </div>

              <div className="top-bar-right">
                <div className="top-clock-chip">
                  <strong>{clockTime}</strong>
                  <span className={`live-status-pill ${loading ? 'syncing' : hasLiveChannelData ? 'live' : 'standby'}`}>
                    {loading ? '● SYNCING' : hasLiveChannelData ? '● LIVE' : activeChannel.hasData ? '● ON AIR' : '○ STANDBY'}
                  </span>
                </div>

                <button
                  className="top-bar-icon-btn"
                  onClick={() => fetchChannelData(false)}
                  title="รีเฟรชข้อมูล (Refresh)"
                  aria-label="รีเฟรชข้อมูล"
                >
                  <RefreshIcon size={16} spinning={loading} />
                </button>

                <button
                  className="top-bar-btn settings-btn"
                  onClick={() => setIsSettingsOpen(true)}
                  title="ตั้งค่าระบบและช่อง (Settings)"
                >
                  <SettingsIcon size={16} />
                  <span>ตั้งค่า</span>
                </button>
              </div>
            </header>

            <LiveStageContainer
              activeChannel={activeChannel}
              streamUrl={streamUrl}
              playerUrl={playerUrl}
              effectiveViewType={effectiveViewType}
              isYouTubeStream={isYouTubeStream}
              currentChannelData={currentChannelData}
              apiUrl={apiUrl}
              loading={loading}
              error={error}
              contentIndex={contentIndex}
              zone={zone}
              getChannelName={getChannelName}
            />

            <section className={`content-rail ${!isControlsVisible ? 'hidden' : ''}`}>
              {playableChannels.slice(0, 5).map((channel, idx) => (
                <button
                  key={channel.key}
                  className={`rail-card ${zone === 'content' && contentIndex === idx + 1 ? 'focused' : ''} ${activeChannel.key === channel.key ? 'active' : ''}`}
                  onClick={() => selectChannel(channels.findIndex((item) => item.key === channel.key))}
                >
                  <span>{channel.category}</span>
                  <strong>{getChannelName(channel)}</strong>
                  <small>{channel.description}</small>
                </button>
              ))}
            </section>

            <footer className={`stream-footer ${!isControlsVisible ? 'hidden' : ''}`}>
              <span>{activeChannel.description}</span>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button className="footer-action" onClick={() => fetchChannelData(false)}>
                  <RefreshIcon size={14} spinning={loading} />
                  <span>REFRESH</span>
                </button>
                <button className="footer-action settings-action" onClick={() => setIsSettingsOpen(true)}>
                  <SettingsIcon size={14} />
                  <span>SETTINGS</span>
                </button>
              </div>
            </footer>
          </main>
        </div>
      )}

      {isSettingsOpen && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            channels={channels}
            onSaveChannels={handleSaveChannels}
            currentChannelNo={activeChannel.no}
            currentInterval={refreshInterval}
          />
        </Suspense>
      )}

      {toastMessage && <div className="tv-toast">{toastMessage}</div>}

      {remoteDigitOsd && (
        <div className="tv-remote-osd" role="status" aria-live="polite">
          <div className="tv-remote-osd-badge">CH {remoteDigitOsd.padStart(2, '0')}</div>
          <div className="tv-remote-osd-hint">กำลังสลับช่อง...</div>
        </div>
      )}

      <div className={`virtual-remote ${!isControlsVisible ? 'hidden' : ''}`}>
        <span className="remote-title">TV REMOTE</span>
        <button className="remote-menu-btn" onClick={() => simulateKeyPress('Menu')}>
          <MenuIcon size={14} />
          <span>MENU</span>
        </button>
        <div className="remote-row">
          <button className="remote-btn" onClick={() => simulateKeyPress('ArrowUp')} aria-label="Up">
            <ArrowUpIcon size={16} />
          </button>
        </div>
        <div className="remote-row">
          <button className="remote-btn" onClick={() => simulateKeyPress('ArrowLeft')} aria-label="Left">
            <ArrowLeftSmallIcon size={16} />
          </button>
          <button className="remote-btn enter-btn" onClick={() => simulateKeyPress('Enter')}>OK</button>
          <button className="remote-btn" onClick={() => simulateKeyPress('ArrowRight')} aria-label="Right">
            <ArrowRightIcon size={16} />
          </button>
        </div>
        <div className="remote-row">
          <button className="remote-btn" onClick={() => simulateKeyPress('ArrowDown')} aria-label="Down">
            <ArrowDownIcon size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

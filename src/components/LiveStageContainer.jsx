import React, { useEffect, useRef } from 'react';
import ChannelDashboard from './ChannelDashboard';

/**
 * LiveStage Container — Deterministic Slot & Memory Management
 * 
 * 1. Force unmounts previous channel DOM on change via key={activeChannel.no}
 * 2. Purges iframe memory using about:blank on cleanup to protect Android WebView RAM
 * 3. Eliminates ghost memory leaks when switching between Iframe / Video / Dashboard
 */
export default function LiveStageContainer({
  activeChannel,
  streamUrl,
  playerUrl,
  effectiveViewType,
  isYouTubeStream,
  currentChannelData,
  apiUrl,
  loading,
  error,
  contentIndex,
  zone,
  getChannelName,
}) {
  const iframeRef = useRef(null);

  // WebView RAM Guard: Force flush previous iframe context when unmounting
  useEffect(() => {
    const frame = iframeRef.current;
    return () => {
      if (frame) {
        try {
          frame.src = 'about:blank';
        } catch (_) {}
      }
    };
  }, []);

  // Focus Guard (Claude Architecture): Refocus window if cross-origin iframe attempts to steal D-pad focus
  useEffect(() => {
    const handleRefocus = () => {
      if (document.activeElement?.tagName === 'IFRAME') {
        window.focus();
      }
    };
    window.addEventListener('blur', handleRefocus);
    window.addEventListener('focus', handleRefocus);
    return () => {
      window.removeEventListener('blur', handleRefocus);
      window.removeEventListener('focus', handleRefocus);
    };
  }, []);

  return (
    <section className={`player-shell ${zone === 'content' && contentIndex === 0 ? 'focused' : ''}`}>
      {effectiveViewType === 'iframe' && streamUrl ? (
        <div className="stream-frame-wrapper" key={`iframe-wrap-${activeChannel?.no}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
          <iframe
            ref={iframeRef}
            key={`iframe-${activeChannel?.no}`}
            src={playerUrl}
            title={getChannelName(activeChannel)}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock"
            referrerPolicy="strict-origin-when-cross-origin"
            className="stream-frame"
            tabIndex={-1}
            loading="eager"
          />
          {/* Key Shield (Claude Architecture): Prevents cross-origin iframe from capturing remote keyboard events */}
          <div
            className="key-shield"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 2
            }}
          />
          {isYouTubeStream && (
            <a
              className="player-external-link"
              href={streamUrl}
              target="_blank"
              rel="noreferrer"
            >
              เปิดใน YouTube
            </a>
          )}
        </div>
      ) : effectiveViewType === 'video' && streamUrl ? (
        <video
          key={`video-${activeChannel?.no}`}
          className="stream-frame"
          src={streamUrl}
          controls
          autoPlay
          muted
          playsInline
        />
      ) : (
        <ChannelDashboard
          key={`dashboard-${activeChannel?.no}`}
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
        <span>{activeChannel?.category}</span>
        <strong>{getChannelName(activeChannel)}</strong>
      </div>
    </section>
  );
}

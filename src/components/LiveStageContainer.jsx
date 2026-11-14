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

  // WebView RAM Guard: Force flush previous iframe context when switching channels
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        try {
          iframeRef.current.src = 'about:blank';
        } catch (_) {}
      }
    };
  }, [activeChannel?.no]);

  return (
    <section className={`player-shell ${zone === 'content' && contentIndex === 0 ? 'focused' : ''}`}>
      {effectiveViewType === 'iframe' && streamUrl ? (
        <div className="stream-frame-wrapper" key={`iframe-wrap-${activeChannel?.no}`}>
          <iframe
            ref={iframeRef}
            key={`iframe-${activeChannel?.no}`}
            src={playerUrl}
            title={getChannelName(activeChannel)}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            className="stream-frame"
            loading="eager"
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

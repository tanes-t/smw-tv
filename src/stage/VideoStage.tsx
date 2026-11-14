import { useEffect, useRef } from 'react';
import IframeStage from './IframeStage';

/**
 * หมายเหตุ: เบราว์เซอร์เล่น RTSP ตรงๆ ไม่ได้
 * ให้แปลงเป็น HLS (.m3u8) หรือ WebRTC ที่เซิร์ฟเวอร์ก่อน เช่น go2rtc / MediaMTX
 */
export default function VideoStage({ url }: { url: string }) {
  if (/youtube(-nocookie)?\.com\/embed/.test(url)) return <IframeStage url={url} />;
  return <Player url={url} />;
}

function Player({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    let alive = true;
    let attempt = 0;
    let retryTimer: number | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hls: any = null;

    const scheduleRetry = () => {
      if (!alive) return;
      const delay = Math.min(30000, 2000 * 2 ** attempt++);
      retryTimer = window.setTimeout(start, delay);
    };

    const start = async () => {
      if (!alive) return;
      const isHls = /\.m3u8(\?|$)/i.test(url);

      if (!isHls || v.canPlayType('application/vnd.apple.mpegurl')) {
        v.src = url;
        v.play().catch(() => {});
        return;
      }

      try {
        // @ts-ignore
        const hlsModule = await import(/* @vite-ignore */ 'hls.js');
        const Hls = hlsModule?.default;
        if (!alive) return;
        if (Hls && Hls.isSupported()) {
          hls = new Hls({
            maxBufferLength: 10,
            maxMaxBufferLength: 20,
            backBufferLength: 0,
            capLevelToPlayerSize: true,
            lowLatencyMode: false,
          });
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            attempt = 0;
            v.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_: unknown, data: { fatal?: boolean }) => {
            if (!data.fatal) return;
            hls?.destroy();
            hls = null;
            scheduleRetry();
          });
          hls.loadSource(url);
          hls.attachMedia(v);
          return;
        }
      } catch (_) {
        // Fallback to native video element
      }
      v.src = url;
      v.play().catch(() => {});
    };

    start();

    return () => {
      alive = false;
      window.clearTimeout(retryTimer);
      hls?.destroy();
      v.pause();
      v.removeAttribute('src');
      v.load(); // ปล่อย decoder/buffer
    };
  }, [url]);

  return <video ref={ref} className="stage-video" muted autoPlay playsInline />;
}

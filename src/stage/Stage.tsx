import { Suspense, lazy, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTVRemote } from '../hooks/useTVRemote';
import IframeStage from './IframeStage';
import type { Channel } from '../types';

// โหลดเมื่อจำเป็นเท่านั้น -> ลด bundle ตอนเริ่มต้น
const VideoStage = lazy(() => import('./VideoStage'));
const KpiStage = lazy(() => import('./KpiStage'));
const ChannelDashboard = lazy(() => import('../components/ChannelDashboard'));

interface Props {
  channels: Channel[];
  activeId: number;
  onSwitch: (id: number) => void;
  onExit: () => void;
}

export default function Stage({ channels, activeId, onSwitch, onExit }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const osdRef = useRef<HTMLDivElement>(null);
  const osdTimer = useRef<number | undefined>(undefined);

  const list = useMemo(() => channels.filter((c) => c.enabled), [channels]);
  const active = list.find((c) => c.id === activeId);

  // OSD ปรับด้วย classList -> ไม่ re-render, ไม่ทำให้ iframe กะพริบ
  const showOsd = useCallback(() => {
    const el = osdRef.current;
    if (!el) return;
    el.classList.add('show');
    window.clearTimeout(osdTimer.current);
    osdTimer.current = window.setTimeout(() => el.classList.remove('show'), 3000);
  }, []);

  useEffect(() => {
    showOsd();
    return () => window.clearTimeout(osdTimer.current);
  }, [activeId, showOsd]);

  const step = (d: 1 | -1) => {
    const i = list.findIndex((c) => c.id === activeId);
    const next = list[(i + d + list.length) % list.length];
    if (next) onSwitch(next.id);
  };

  useTVRemote({
    scope: wrapRef,
    spatial: false,
    onDirection: (dir) => {
      step(dir === 'up' || dir === 'left' ? -1 : 1);
      return true; // กินปุ่ม ไม่ให้ไปทำ spatial nav
    },
    onEnter: showOsd,
    onBack: () => {
      onExit();
      return true;
    },
    onDigits: (n) => {
      const t = list.find((c) => c.id === n);
      if (t) onSwitch(t.id);
    },
  });

  // iframe ข้ามโดเมนแย่ง focus ได้ -> ดึงกลับมาที่ wrapper เพื่อให้รีโมตยังทำงาน
  useEffect(() => {
    const w = wrapRef.current;
    w?.focus();
    const refocus = () => window.setTimeout(() => w?.focus(), 0);
    window.addEventListener('blur', refocus);
    return () => window.removeEventListener('blur', refocus);
  }, [activeId]);

  if (!active) return null;

  return (
    <div ref={wrapRef} className="stage" tabIndex={0}>
      {/* key={active.id} -> เปลี่ยนช่องแล้ว unmount ตัวเก่าทันที (cleanup ทำงาน) */}
      <Suspense fallback={<div className="stage-loading">กำลังโหลด…</div>}>
        {active.type === 'iframe' && <IframeStage key={active.id} url={active.url || active.streamUrl || ''} />}
        {active.type === 'video' && <VideoStage key={active.id} url={active.url || active.streamUrl || ''} />}
        {active.type === 'kpi' && (
          <KpiStage key={active.id} url={active.url || active.apiUrl || ''} refreshMin={active.refreshMin || 5} />
        )}
        {active.type === 'dashboard' && (
          <ChannelDashboard
            key={active.id}
            channel={active}
            apiUrl={active.apiUrl || active.url}
          />
        )}
      </Suspense>

      <div ref={osdRef} className="osd">
        CH {String(active.id).padStart(2, '0')} · {active.name}
      </div>
    </div>
  );
}

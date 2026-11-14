import { useEffect, useState } from 'react';

interface Kpi {
  label: string;
  value: number | string;
  unit?: string;
  target?: number;
  status?: 'ok' | 'warn' | 'bad';
}
interface Payload {
  title?: string;
  updatedAt?: string;
  items: Kpi[];
}

const CACHE_PREFIX = 'smw-kpi:';

function readCache(url: string): Payload | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + url);
    return raw ? (JSON.parse(raw) as Payload) : null;
  } catch {
    return null;
  }
}

export default function KpiStage({ url, refreshMin }: { url: string; refreshMin: number }) {
  const [data, setData] = useState<Payload | null>(() => readCache(url));
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let alive = true;
    let ctrl: AbortController | undefined;

    const load = async () => {
      if (document.hidden) return; // ไม่ดึงข้อมูลตอนจอไม่ได้แสดง
      ctrl?.abort();
      const c = (ctrl = new AbortController());
      const timeout = window.setTimeout(() => c.abort(), 10000);
      try {
        const res = await fetch(url, { signal: c.signal, cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as Payload;
        if (!alive) return;
        setData(json);
        setOffline(false);
        try {
          localStorage.setItem(CACHE_PREFIX + url, JSON.stringify(json));
        } catch {
          /* เต็ม/ถูกบล็อก: ข้าม */
        }
      } catch {
        if (alive) setOffline(true); // คงค่าที่ cache ไว้บนจอ
      } finally {
        window.clearTimeout(timeout);
      }
    };

    load();
    const timer = window.setInterval(load, Math.max(1, refreshMin) * 60_000);
    const onVis = () => {
      if (!document.hidden) load();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      alive = false;
      ctrl?.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [url, refreshMin]);

  if (!data) return <div className="stage-loading">กำลังโหลดข้อมูล…</div>;

  return (
    <div className="kpi">
      <header className="kpi-head">
        <h1>{data.title ?? 'KPI'}</h1>
        {offline && <span className="kpi-offline">OFFLINE · ข้อมูลล่าสุดที่บันทึกไว้</span>}
        {data.updatedAt && <span className="kpi-time">{data.updatedAt}</span>}
      </header>
      <div className="kpi-grid">
        {data.items.map((k) => {
          const num = Number(k.value);
          const pct = k.target && !Number.isNaN(num) ? Math.max(0, Math.min(1, num / k.target)) : null;
          return (
            <div key={k.label} className={`kpi-card ${k.status ?? 'ok'}`}>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">
                {k.value}
                {k.unit && <small>{k.unit}</small>}
              </div>
              {pct !== null && (
                <div className="kpi-bar">
                  {/* ใช้ scaleX (compositor-only) แทนการเปลี่ยน width */}
                  <i style={{ transform: `scaleX(${pct})` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

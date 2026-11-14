import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { useTVRemote } from '../hooks/useTVRemote';
import type { Category, Channel } from '../types';

interface Props {
  channels: Channel[];
  lastFocusedId?: number;
  onSelect: (id: number) => void;
  onFocusId: (id: number) => void; // เก็บใน ref ที่ App (ไม่ trigger re-render)
}

function Gallery({ channels, lastFocusedId, onSelect, onFocusId }: Props) {
  const root = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => {
    const map = new Map<string, Channel[]>();
    for (const c of channels) {
      if (!c.enabled) continue;
      const cat = String(c.category || 'Factory');
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(c);
    }
    return Array.from(map.entries()).map(([cat, items]) => ({ cat, items }));
  }, [channels]);

  const { focusEl } = useTVRemote({
    scope: root,
    onEnter: (el) => {
      const id = Number(el?.dataset.id);
      if (id) onSelect(id);
    },
    onDigits: (n) => {
      if (channels.some((c) => c.id === n && c.enabled)) onSelect(n);
    },
    onFocusChange: (el) => onFocusId(Number(el.dataset.id)),
  });

  // กลับจาก Stage -> คืน focus ที่ช่องเดิม
  useLayoutEffect(() => {
    const r = root.current;
    if (!r) return;
    const saved = lastFocusedId ? r.querySelector<HTMLElement>(`[data-id="${lastFocusedId}"]`) : null;
    focusEl(saved ?? r.querySelector<HTMLElement>('[data-focusable]'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={root} className="gallery" data-scroller>
      <header className="gallery-title">SMW Gallery</header>
      {groups.map(({ cat, items }) => (
        <section key={cat} className="row">
          <h2>{cat}</h2>
          <div className="row-track" data-scroller>
            {items.map((c) => (
              <button key={c.id} className="card" data-focusable data-id={c.id} tabIndex={-1}>
                <div className="card-top">
                  <span className="card-ch">CH {String(c.id).padStart(2, '0')}</span>
                  {c.thumbnail && <img src={c.thumbnail} alt="" className="card-icon" />}
                </div>
                <div className="card-bottom">
                  <span className="card-name">{c.name}</span>
                  <span className="card-type">{(c.type || 'DASHBOARD').toUpperCase()}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default memo(Gallery);

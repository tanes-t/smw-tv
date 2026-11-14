import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export type Dir = 'up' | 'down' | 'left' | 'right';

export interface TVRemoteOptions {
  /** container ที่ครอบ element ที่ focus ได้ (data-focusable) */
  scope: RefObject<HTMLElement | null>;
  enabled?: boolean;
  /** false = ปิด spatial navigation (เช่นใน Stage) */
  spatial?: boolean;
  onEnter?: (el: HTMLElement | null) => void;
  /** คืน true ถ้าจัดการแล้ว */
  onBack?: () => boolean | void;
  onDigits?: (n: number) => void;
  /** คืน true เพื่อ "กิน" ปุ่ม ไม่ให้ spatial navigation ทำงานต่อ */
  onDirection?: (dir: Dir, current: HTMLElement | null) => boolean | void;
  onFocusChange?: (el: HTMLElement) => void;
  digitTimeoutMs?: number; // default 1500
  repeatIntervalMs?: number; // กดค้าง: ขั้นต่ำระหว่างการเลื่อน default 90
}

const FOCUSABLE = '[data-focusable]';
const SCROLL_MARGIN = 80;

type Parsed =
  | { type: 'dir'; dir: Dir }
  | { type: 'enter' }
  | { type: 'back' }
  | { type: 'digit'; value: string };

/** แปลง KeyboardEvent จากรีโมต/คีย์บอร์ด/WebView หลายยี่ห้อ ให้เป็นคำสั่งเดียว */
function parse(e: KeyboardEvent): Parsed | null {
  const k = e.key;
  const c = e.keyCode;

  if (k === 'ArrowUp' || c === 38) return { type: 'dir', dir: 'up' };
  if (k === 'ArrowDown' || c === 40) return { type: 'dir', dir: 'down' };
  if (k === 'ArrowLeft' || c === 37) return { type: 'dir', dir: 'left' };
  if (k === 'ArrowRight' || c === 39) return { type: 'dir', dir: 'right' };

  // Enter / DPAD_CENTER (23) / KEYCODE_ENTER (66)
  if (k === 'Enter' || c === 13 || c === 23 || c === 66) return { type: 'enter' };

  // Back: Escape, Backspace, Android KEYCODE_BACK(4), Samsung 10009, LG 461
  if (
    k === 'Escape' ||
    k === 'Backspace' ||
    k === 'GoBack' ||
    k === 'BrowserBack' ||
    k === 'XF86Back' ||
    c === 27 ||
    c === 8 ||
    c === 4 ||
    c === 10009 ||
    c === 461
  )
    return { type: 'back' };

  if (/^[0-9]$/.test(k)) return { type: 'digit', value: k };
  if (c >= 48 && c <= 57) return { type: 'digit', value: String(c - 48) };
  if (c >= 96 && c <= 105) return { type: 'digit', value: String(c - 96) };

  return null;
}

/** เลือก element ถัดไปตามทิศ: ให้คะแนนจากระยะห่าง + ความเยื้องแกนขวาง + การซ้อนทับ */
function pickNext(cur: HTMLElement, list: HTMLElement[], dir: Dir): HTMLElement | null {
  const a = cur.getBoundingClientRect();
  const acx = a.left + a.width / 2;
  const acy = a.top + a.height / 2;
  const horizontal = dir === 'left' || dir === 'right';
  const sign = dir === 'right' || dir === 'down' ? 1 : -1;

  let best: HTMLElement | null = null;
  let bestScore = Infinity;

  for (let i = 0; i < list.length; i++) {
    const el = list[i];
    if (el === cur) continue;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;

    const bcx = b.left + b.width / 2;
    const bcy = b.top + b.height / 2;

    const dMain = horizontal ? (bcx - acx) * sign : (bcy - acy) * sign;
    if (dMain <= 1) continue; // ต้องอยู่ "ด้านหน้า" ตามทิศที่กด

    const gap = horizontal
      ? sign > 0 ? b.left - a.right : a.left - b.right
      : sign > 0 ? b.top - a.bottom : a.top - b.bottom;
    const dCross = Math.abs(horizontal ? bcy - acy : bcx - acx);
    const overlap = horizontal
      ? Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      : Math.min(a.right, b.right) - Math.max(a.left, b.left);

    const score =
      Math.max(gap, 0) + dCross * 2 - (overlap > 0 ? overlap * 0.5 : 0) + (overlap > 0 ? 0 : 500);

    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

/** เลื่อนทุก scroller (data-scroller) ที่ครอบ el ให้เห็น el เสมอ — เลื่อนทันที ไม่ใช้ smooth */
function ensureVisible(el: HTMLElement) {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    if (node.hasAttribute('data-scroller')) {
      const s = node.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      if (r.top < s.top + SCROLL_MARGIN) node.scrollTop += r.top - s.top - SCROLL_MARGIN;
      else if (r.bottom > s.bottom - SCROLL_MARGIN) node.scrollTop += r.bottom - s.bottom + SCROLL_MARGIN;
      if (r.left < s.left + SCROLL_MARGIN) node.scrollLeft += r.left - s.left - SCROLL_MARGIN;
      else if (r.right > s.right - SCROLL_MARGIN) node.scrollLeft += r.right - s.right + SCROLL_MARGIN;
    }
    node = node.parentElement;
  }
}

export function useTVRemote(opts: TVRemoteOptions) {
  // เก็บ options ล่าสุดใน ref -> ผูก listener ครั้งเดียว ไม่ต้อง re-attach ทุก render
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const lastMove = useRef(0);
  const digitBuf = useRef('');
  const digitTimer = useRef<number | undefined>(undefined);

  const focusEl = useCallback((el: HTMLElement | null | undefined) => {
    if (!el) return false;
    el.focus({ preventScroll: true });
    ensureVisible(el);
    optsRef.current.onFocusChange?.(el);
    return true;
  }, []);

  const focusFirst = useCallback(() => {
    const root = optsRef.current.scope.current;
    if (!root) return false;
    return focusEl(
      root.querySelector<HTMLElement>('[data-autofocus]') ?? root.querySelector<HTMLElement>(FOCUSABLE)
    );
  }, [focusEl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const o = optsRef.current;
      if (o.enabled === false) return;

      const cmd = parse(e);
      if (!cmd) return;
      e.preventDefault();
      e.stopPropagation();

      const root = o.scope.current;
      const active = document.activeElement as HTMLElement | null;
      const current =
        active && root && root.contains(active) && active.hasAttribute('data-focusable') ? active : null;

      switch (cmd.type) {
        case 'dir': {
          const now = performance.now();
          if (e.repeat && now - lastMove.current < (o.repeatIntervalMs ?? 90)) return;
          lastMove.current = now;

          if (o.onDirection?.(cmd.dir, current) === true) return;
          if (o.spatial === false || !root) return;

          if (!current) {
            focusFirst(); // โฟกัสหลุด -> กู้กลับมาเสมอ
            return;
          }
          const list = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
          focusEl(pickNext(current, list, cmd.dir)); // ไม่มีตัวถัดไป = อยู่ที่เดิม
          return;
        }
        case 'enter':
          if (o.onEnter) o.onEnter(current);
          else current?.click();
          return;
        case 'back':
          o.onBack?.();
          return;
        case 'digit': {
          if (!o.onDigits) return;
          window.clearTimeout(digitTimer.current);
          digitBuf.current += cmd.value;
          const commit = () => {
            const n = Number(digitBuf.current);
            digitBuf.current = '';
            if (!Number.isNaN(n)) optsRef.current.onDigits?.(n);
          };
          if (digitBuf.current.length >= 2) commit();
          else digitTimer.current = window.setTimeout(commit, o.digitTimeoutMs ?? 1500);
          return;
        }
      }
    };

    window.addEventListener('keydown', onKey, true); // capture: ได้ก่อน element อื่น
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.clearTimeout(digitTimer.current);
    };
  }, [focusEl, focusFirst]);

  return { focusEl, focusFirst };
}

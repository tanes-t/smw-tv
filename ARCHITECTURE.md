# SMW-TV — Architecture (TV-First, Ultra-High Performance)

## 1) สรุปการตัดสินใจ

**เลือก: React 18 + Vite (SPA แบบ static) + Vercel Serverless Functions สำหรับ `/api/config` (Vercel KV)**
ไม่ใช้ Next.js เป็นตัวแอปหลัก

| เหตุผล | อธิบาย |
|---|---|
| ไม่ต้องมี SSR | แดชบอร์ดบนทีวีเป็นแอปที่เปิดค้างตลอด ไม่มี SEO และไม่ได้ประโยชน์จาก SSR/RSC แต่ต้องแบก runtime และ hydration เพิ่ม |
| Bundle เล็กกว่า | Vite + React ได้ราว 60–120 KB gzip เหมาะกับ CPU ARM ช้าๆ (parse JS ใช้เวลามาก) |
| ควบคุม build target | Android TV WebView มักเป็น Chromium เก่า (70–90) ตั้ง `build.target: 'chrome69'` และใช้ `@vitejs/plugin-legacy` ถ้าต้องรองรับต่ำกว่านี้ |
| Offline ง่าย | static files + Service Worker precache ได้ตรงๆ เปิดแอปได้แม้เน็ตหลุด |
| Next.js ยังใช้ได้ | ถ้าองค์กรอยากรวมเป็น repo เดียว ให้ใช้ Next.js แบบ `output: 'export'` (static) เท่านั้น |

**State:** `useRef` สำหรับค่าที่ไม่ต้อง re-render (เช่นตำแหน่ง focus), `useState` เฉพาะ mode/config, ไม่ใช้ global store หนักๆ
**Routing:** ไม่ใช้ router; มี 2 mode (`gallery` | `stage`) สลับด้วย state เพื่อให้มีเพียงหน้าเดียวใน DOM เสมอ

## 2) โครงสร้างโฟลเดอร์

```
smw-tv/
├─ api/config.ts            # GET/PUT config -> Vercel KV (มี version + updatedAt)
├─ public/sw.js             # precache app shell (offline fallback)
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx               # สลับ Gallery <-> Stage, โหลด/ซิงก์ config
│  ├─ types.ts
│  ├─ hooks/useTVRemote.ts  # D-Pad + spatial navigation + digits
│  ├─ gallery/Gallery.tsx   # Mode A
│  ├─ stage/
│  │  ├─ Stage.tsx          # Mode B (mount เฉพาะช่องเดียว)
│  │  ├─ IframeStage.tsx
│  │  ├─ VideoStage.tsx     # HLS / YouTube (lazy)
│  │  └─ KpiStage.tsx       # Google Sheets / Apps Script (lazy)
│  ├─ hub/                  # Channel & System Hub (รอบถัดไป)
│  └─ styles/tv.css
└─ vite.config.ts
```

## 3) Performance Strategies Blueprint

| หมวด | ปัญหาเดิม | มาตรการ | ผลที่ได้ |
|---|---|---|---|
| **GPU / CSS** | `box-shadow`, glow, `backdrop-filter: blur` | **ห้ามใช้ทั้งหมด** ใช้ `outline` + สีทึบ + border แทน | ลด repaint/overdraw มากที่สุด |
| | `transform: scale()` หลายชั้น | อนิเมชันเฉพาะ `transform`/`opacity` และไม่เกิน 150 ms; ไม่ซ้อน layer; ไม่ใช้ `will-change` พร่ำเพรื่อ | ลดจำนวน compositing layer / VRAM |
| | Gradient/ภาพพื้นหลังใหญ่ | พื้นหลังสีทึบ, รูปเป็น WebP ขนาดจริง | ลด texture memory |
| **ความละเอียด** | ทีวี 1080p/4K ทำให้ pixel เยอะ | ตั้ง `<meta name="viewport" content="width=1280">` วาดที่ 720p แล้วให้ทีวี upscale | พื้นที่วาดลดลง ~56% (เทียบ 1080p) |
| **DOM** | DOM ใหญ่ | Gallery < ~300 nodes; หน้าเดียวใน DOM; `content-visibility: auto` ที่แต่ละ row; ถ้าช่อง > 100 ใช้ windowing | layout/style recalculation เร็วขึ้น |
| **React** | re-render ไม่จำเป็น | `React.memo`, เก็บ focus ใน ref, OSD ปรับด้วย `classList` (ไม่ re-render), `key` เพื่อ remount stage | CPU ว่าง |
| **JS bundle** | parse/execute ช้า | code-split (`lazy` สำหรับ Video/KPI), `hls.js` โหลดเมื่อใช้, tree-shake, เป้าหมาย < 150 KB gzip | boot เร็ว |
| **iframe** | หลายหน้าพร้อมกัน, leak | **mount ครั้งละ 1 iframe**; cleanup ตั้ง `src='about:blank'` ก่อนถอด; ไม่ preload ช่องข้างเคียง | RAM คงที่ |
| **Video** | buffer บวม | `hls.js`: `maxBufferLength:10`, `backBufferLength:0`, `capLevelToPlayerSize`; cleanup เรียก `destroy()` + `video.load()`; RTSP **เล่นใน browser ไม่ได้** ต้องแปลงเป็น HLS/WebRTC ด้วย go2rtc / MediaMTX | ลด RAM + decoder leak |
| **Network/Timer** | polling ค้าง | `AbortController`, หยุด refresh เมื่อ `document.hidden`, ล้าง `setInterval` ทุกครั้ง, cache ล่าสุดใน `localStorage` | ไม่มี request สะสม |
| **Memory lifecycle** | WebView บวมเมื่อรันนาน | soft reload ตามเวลา (เช่น 03:00 ทุกวัน) + `onTrimMemory` ฝั่ง Android → `webView.clearCache(false)` | รันได้ 24/7 |
| **Focus** | scroll หน่วง/กระโดด | scroll แบบทันทีด้วย `scrollTop/Left` (ไม่ใช้ smooth), `focus({preventScroll:true})` | ไหลลื่นบน CPU ต่ำ |
| **Offline** | เน็ตหลุดแล้วจอดำ | Service Worker precache; config โหลด `localStorage` ก่อนแล้วซิงก์ทีหลัง; KPI แสดงค่า cache + ป้าย "OFFLINE" | ใช้งานต่อได้ |

### ฝั่ง Android Shell (WebView)
- `android:hardwareAccelerated="true"` ใน Manifest
- อัปเดต *Android System WebView* ของกล่องให้ใหม่ที่สุดเท่าที่ทำได้
- `settings.mediaPlaybackRequiresUserGesture = false`
- ส่งปุ่ม Back ของรีโมตเข้าเว็บ (`dispatchKeyEvent`) แล้วให้เว็บเป็นผู้ตัดสินใจ; ถ้าเว็บไม่จัดการจึงค่อยออกจากแอป

## 4) ปุ่มรีโมตที่รองรับ

| ปุ่ม | Gallery | Stage |
|---|---|---|
| ↑ ↓ ← → | Spatial navigation | ↑/← ช่องก่อนหน้า, ↓/→ ช่องถัดไป |
| Enter | เปิดช่องที่ focus | แสดง OSD ชื่อช่อง |
| Back / Esc / Backspace | (ปล่อยให้ระบบออกแอป) | กลับหน้า Gallery |
| 0–9 | พิมพ์เลขช่อง (2 หลัก หรือรอ 1.5 วินาที) | พิมพ์เลขช่องเพื่อสลับ |

หมายเหตุ iframe ข้ามโดเมน (PowerBI / Looker): เมื่อ focus เข้า iframe หน้าแม่จะไม่ได้รับปุ่ม จึงตั้ง `tabIndex=-1` และดึง focus กลับที่ wrapper ทุกครั้งที่ window `blur`

## 5) Config Sync

1. เปิดแอป → อ่าน `localStorage` ทันที (ไม่ต้องรอเน็ต)
2. เบื้องหลังเรียก `GET /api/config` (timeout 5 วินาที) ถ้า `version` ใหม่กว่าจึงแทนที่
3. `PUT /api/config` ต้องแนบ token (ตั้งเป็น env บน Vercel)
4. Export/Import JSON: ปุ่มใน System Hub ใช้ schema เดียวกับ `AppConfig` ใน `types.ts`

## 6) รอบถัดไป
- Channel & System Hub (ฟอร์มตั้งค่า CH 01–20, Export/Import)
- `api/config.ts` + Service Worker
- ชุดทดสอบ Spatial Navigation บนอุปกรณ์จริง

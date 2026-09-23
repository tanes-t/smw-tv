# SMW-TV App Architecture

## เป้าหมาย

สร้าง streaming TV app สำหรับ Google TV/Android TV ที่:

- รองรับหลายช่องข้อมูลจากหลาย API
- รองรับหลายแหล่งสตรีม เช่น iframe dashboard, video URL, CCTV/stream endpoint
- ควบคุมด้วยรีโมททีวีผ่าน D-pad
- Build เป็น APK เพื่อติดตั้งบน Google TV ได้
- เปิดเต็มจอแบบ kiosk display
- Auto-start หลังเปิดเครื่องหรือไฟกลับมา

## โครงสร้างหลัก

```txt
src/
  App.jsx                         # Streaming shell, channel rail, player, settings
  config/
    tvChannels.js                 # registry ช่อง/API/stream source/view type ทั้งหมด
  components/
    Channel1_Production.jsx       # iframe dashboard channel
    ChannelPlaceholder.jsx        # dashboard placeholder สำหรับช่องรอเชื่อม API
    SettingsModal.jsx             # ตั้งค่า API URL/refresh interval
  hooks/
    useTVNavigation.js            # D-pad/keyboard navigation

android-webview-shell/
  app/src/main/assets/            # ไฟล์จาก dist/ ที่ฝังเข้า APK
  app/src/main/java/.../
    MainActivity.java             # Android WebView kiosk shell
    BootReceiver.java             # auto-start on boot
```

## Streaming Channel Registry

ไฟล์หลัก: `src/config/tvChannels.js`

ทุกช่องควรกำหนดผ่าน `TV_CHANNELS` เท่านั้น:

```js
{
  no: '01',
  key: 'production',
  name: 'Production TV',
  hasData: true,
  view: 'iframe',
  streamType: 'iframe',
  streamUrl: 'https://...',
  apiUrl: 'https://...',
  apiAction: 'getTVData'
}
```

### Field Meaning

- `no`: เลขช่องบน sidebar
- `key`: key ภายในระบบ ห้ามซ้ำ
- `name`: ชื่อแสดงบน TV
- `hasData`: ใช้บอกว่าช่องนี้เชื่อมข้อมูลจริงแล้วหรือยัง
- `view`: ชนิดหน้าจอ เช่น `iframe`, `dashboard`, `settings`
- `streamType`: ชนิดแหล่งสตรีม เช่น `iframe`, `video`, `placeholder`, `settings`
- `streamUrl`: URL ที่ player ใช้แสดงผล
- `apiUrl`: URL เริ่มต้นของช่อง
- `apiAction`: action query string สำหรับ API เช่น `getTVData`

## Multi-API Strategy

แต่ละช่องมี API URL แยกกัน และบันทึกใน `localStorage` ด้วย key:

```txt
smw_tv_channel_01_api_url
smw_tv_channel_02_api_url
...
smw_tv_channel_19_api_url
```

CH01 ยังรองรับค่าเก่า:

```txt
smw_tv_api_url
```

เพื่อไม่ให้เครื่องเดิมต้องตั้งค่าใหม่หลังอัปเดต

## Player Source Types

### `iframe`

ใช้กับ dashboard ที่มีหน้าเว็บสำเร็จรูปอยู่แล้ว เช่น Production TV

```txt
Streaming shell -> iframe player -> external dashboard/live page
```

เหมาะกับ:

- Google Apps Script dashboard
- dashboard เดิมที่พร้อมแสดงบนจอ
- ระบบที่ต้องการแยก deployment

### `dashboard`

ใช้กับช่องที่ต้อง render UI ใน React app โดยตรง

```txt
TV shell -> fetch API -> React dashboard component
```

เหมาะกับ:

- KPI cards
- ตาราง production/QA/warehouse
- alert board
- data ที่ต้องรวมหลาย source

### `settings`

CH20 ใช้เปิดหน้าตั้งค่า ไม่ fetch data

### `video`

ใช้กับ URL วิดีโอที่ browser/WebView เล่นได้โดยตรง เช่น MP4 หรือ stream endpoint ที่รองรับ native HTML video

```txt
Streaming shell -> video player -> stream URL
```

## API Contract เบื้องต้น

API ของแต่ละช่องควรตอบ JSON รูปแบบนี้:

```json
{
  "success": true,
  "kpi": {
    "dashConfig": {
      "refreshTrigger": "2026-09-19T09:00:00+07:00"
    }
  },
  "metrics": [],
  "rows": []
}
```

### Required

- `success`: boolean

### Optional

- `kpi.dashConfig.refreshTrigger`: token สำหรับสั่ง refresh จากส่วนกลาง
- `metrics`: KPI cards
- `rows`: table data

## Android APK Architecture

Android shell ใช้ WebView โหลดไฟล์ React ที่ build แล้วจาก:

```txt
file:///android_asset/index.html
```

Manifest ตั้งค่าแล้ว:

- `INTERNET`
- `RECEIVE_BOOT_COMPLETED`
- `LEANBACK_LAUNCHER`
- landscape mode

MainActivity ตั้งค่าแล้ว:

- fullscreen immersive mode
- keep screen on
- JavaScript enabled
- DOM storage enabled
- file asset loading
- no external browser

## Build APK Flow

1. Build React app:

```bash
npm run build
```

2. Copy ไฟล์ใน `dist/` ไปที่:

```txt
android-webview-shell/app/src/main/assets/
```

3. เปิด Android Studio ที่:

```txt
android-webview-shell/
```

4. Build APK:

```txt
Build > Build Bundle(s) / APK(s) > Build APK(s)
```

5. ติดตั้ง `app-debug.apk` บน Google TV

## Development Rules

- เพิ่มช่องใหม่ที่ `src/config/tvChannels.js` ก่อน
- หลีกเลี่ยง hardcode API URL ใน component
- CH20 สงวนไว้สำหรับ settings
- อย่าแก้ Android shell ถ้าเปลี่ยนแค่ UI/API
- ก่อนออก APK ให้รัน `npm run build` ทุกครั้ง
- หลัง build ต้อง copy `dist/` เข้า Android assets ใหม่ทุกครั้ง

## Multi-Channel API Status

- [x] เพิ่ม dashboard component กลางสำหรับ `view: 'dashboard'` (`ChannelDashboard.jsx`)
- [x] ให้ Settings เลือกตั้งค่า API รายช่อง (CH 01 - CH 10) ได้จาก dropdown พร้อมปุ่มทดสอบการเชื่อมต่อสด
- [x] รองรับการดึงข้อมูล JSON จากระบบหลักและแยกตามแผนกอัตโนมัติ (QA, Warehouse, TPM, Dispatch ฯลฯ)
- [x] เพิ่ม npm script `sync:android` สำหรับ copy `dist/` เข้า Android assets อัตโนมัติ
- [ ] เพิ่ม Gradle wrapper เพื่อ build APK ผ่าน command line
- [ ] เพิ่ม release signing config สำหรับ APK ใช้งานจริง


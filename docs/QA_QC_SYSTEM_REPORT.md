# 📋 SMW-TV • Comprehensive QC & Technical Analysis Report
> **วันที่จัดทำ:** 16 พฤศจิกายน 2026  
> **วัตถุประสงค์:** รายงานผลการตรวจสอบคุณภาพระบบ (Quality Control) วิเคราะห์ปัญหาเชิงลึก และสรุปข้อติดขัดทางเทคนิคและดีไซน์เพื่อให้ Claude นำไปวิเคราะห์และออกแบบแนวทางแก้ไขขั้นต่อไป

---

## 1. Executive Summary (ภาพรวมสถานะระบบ)
ระบบ **SMW-TV** เป็นเว็บแดชบอร์ดสำหรับแสดงผลบนจอสมาร์ททีวี (Smart Manufacturing Wallboard) ผ่าน Android WebView Shell และ Web Browser ปัจจุบันสามารถบิลด์และรันได้ปกติบน Vercel (`https://smw-tv.vercel.app`)

อย่างไรก็ตาม จากการทดสอบ QC เชิงลึก พบประเด็นสำคัญที่ต้องได้รับการแก้ไข 4 ด้านหลัก:
1. **The Beauty vs. Performance Dilemma:** การตัดฟีเจอร์ดีไซน์จนกลายเป็น "ความสวยหายไป 90%"
2. **Architectural Drift / Dual-Stack Conflict:** มีโค้ด 2 ชุดที่ไม่ได้ผสานกัน (`.jsx` ตัวเดิม vs `.tsx` ของ Claude)
3. **Hardware & WebView Runtime Issues:** ปัญหาโฟกัสรีโมตหลุดเมื่อเจอ iframe ข้ามโดเมน และความหน่วงบน Android TV
4. **Code Quality & React 19 Compiler Rules:** ข้อผิดพลาด Runtime Bug และ Lint Warning ใน Settings Modal

---

## 2. เจาะลึกปัญหาที่พบจากการ QC (Detailed Findings)

### 🔴 ปัญหาที่ 1: Architectural Drift & Dead Code (โค้ดแตกเป็น 2 ทาง)
- **สภาพปัจจุบัน:** 
  - แอปที่รันจริงในโปรดักชันยังคงใช้: `src/main.jsx` ➔ `src/App.jsx` + `src/components/NetflixGallery.jsx` + `src/index.css` (3,500 บรรทัด)
  - ขณะที่โค้ดสถาปัตยกรรมใหม่ของ Claude อยู่ใน: `src/App.tsx`, `src/gallery/Gallery.tsx`, `src/stage/Stage.tsx`, `src/styles/tv.css` (105 บรรทัด) กลายเป็น **Dead Code ที่ไม่ได้ถูกเชื่อมต่อจริง**
- **สาเหตุที่ผู้ใช้ยกเลิกการใช้ `tv.css` ของ Claude:**
  - `tv.css` ทำการ Optimize แบบ **Extreme Brutalist** (ตัดรูปภาพ, ตัด SVG Graphic, ตัด Hero Billboard, ตัด Badge ออกหมดเหลือแค่กล่องสี่เหลี่ยมสีเทากับกรอบสีทอง)
  - ผู้ใช้ระบุว่า *"ความสวยงามหายไป 90%"* เพราะสูญเสียความพรีเมียมของแบรนด์ Siam Metal Work

---

### 🔴 ปัญหาที่ 2: Focus Trapping เมื่อเปิด Iframe ข้ามโดเมน (TV Remote Lost Focus)
- **พฤติกรรมของปัญหา:**
  - เมื่อสลับไปยังช่องที่เป็น `view: iframe` (เช่น Google Looker Studio, PowerBI, หรือเว็บภายนอก)
  - หากผู้ใช้เผลอกดรีโมต หรือเคอร์เซอร์หลุดเข้าไปใน `<iframe>` ตัว Parent Window ของเว็บจะไม่ได้รับ Event คีย์บอร์ดจากรีโมต TV อีกต่อไป
  - ทำให้กดปุ่ม Back, ลูกศร หรือปุ่มตัวเลขบนรีโมตไม่ได้ ต้องปิด-เปิดแอปใหม่
- **แนวทางแก้ไขที่ต้องวิเคราะห์:**
  - ต้องมี Transparent Click/Focus Overlay Interceptor หรือกลไก `refocus` ดักจับ `window.onblur` ตลอดเวลาเมื่ออยู่ใน Stage Mode

---

### 🔴 ปัญหาที่ 3: Bundle Size และการทำ Code Splitting บน WebView
- **สถานะ Build ปัจจุบัน:**
  - `dist/assets/index-BqO16ydm.js`: **288.39 kB (gzip 85 kB)** (ยังไม่ทำ Lazy Loading ให้กับโมดอล)
  - `dist/assets/index-C8zLjuLJ.css`: **52.75 kB (gzip 10.16 kB)**
- **ผลกระทบต่อ Android TV:**
  - ชิปประมวลผล ARM บนกล่อง Android TV มีความเร็วในการ Parse/Compile JavaScript ต่ำกว่า PC มาก
  - `SettingsModal.jsx` (ขนาด 870 บรรทัด) และ `ChannelDashboard.jsx` ถูกรวมเข้าใน Main Bundle ตั้งแต่วินาทีแรก แม้ว่าหน้าจอทีวีจะเปิดทิ้งไว้ดูสตรีมเพียงอย่างเดียว
- **เป้าหมาย:** ต้องแยก `SettingsModal` ออกเป็น Dynamic Chunk (`React.lazy`) เพื่อให้ Initial Bundle ของหน้ารับชมเหลือต่ำกว่า 200 kB

---

### 🔴 ปัญหาที่ 4: Bugs & React 19 Lint Warnings ในโค้ด
จากการรัน `eslint` และเครื่องมือตรวจเช็ค พบปัญหาดังนี้:

1. **[CRITICAL BUG - แก้ไขเบื้องต้นแล้ว] `ReferenceError: TV_CHANNELS is not defined`**:
   - ใน `src/App.jsx:538` มีโค้ดเรียก `TV_CHANNELS.findIndex(...)` ซึ่งตัวแปรไม่มีอยู่จริง ทำให้เมื่อผู้ใช้กดคลิกช่องจาก Content Rail ด้านล่าง แอปจะ Crash ทันที
2. **Impure Calls ใน `SettingsModal.jsx`**:
   - บรรทัดที่ 148, 184: เรียก `Date.now()` ระหว่าง render เพื่อสร้าง channel key
   - บรรทัดที่ 253, 260: เรียก `performance.now()` ระหว่าง trigger API test
   - React 19 Compiler ฟ้อง Error: *Cannot call impure function during render*
3. **Cascading Re-render Effects**:
   - `SettingsModal.jsx:75`: เรียก `setChannelList(copy)` ตรงๆ ภายใน `useEffect` ทำให้เกิด re-render ซ้ำซ้อน 2-3 รอบเมื่อเปิดหน้าต่างตั้งค่า

---

### 🔴 ปัญหาที่ 5: Design System Formula (สัดส่วนสี ขาว 50 / แดง 20 / ดำ 20 / อื่นๆ 10)
- ผู้ใช้ระบุ Requirement ชัดเจน: **"ขาว 50 | แดง 20 | ดำ 20 | สีอื่น 10"**
- ปัจจุบันได้ปรับแก้ใน `src/index.css`:
  - **ขาว 50%:** พื้นการ์ดด้านล่าง (`.card-details`), การ์ดสถิติ KPI (`.tv-card`), ตารางข้อมูล (`.tv-table`) เป็นสีขาวสว่าง ตัวหนังสือสีเข้ม คมชัด
  - **แดง 20%:** สีแบรนด์ SMW (`#E50914`) สำหรับกรอบ Focus, ป้ายเลขช่อง (`CH 01`), ปุ่ม Play, แถบสถานะ
  - **ดำ 20%:** ฉากหลัง Canvas หลัก (`#0B0D12`), แถบเมนูด้านบน และกรอบ Video Player
  - **สีอื่น 10%:** เขียวมรกต (`#10B981` สำหรับ LIVE), ฟ้า Cyan (`#06B6D4` สำหรับ HD/CCTV), ส้ม Amber (`#F59E0B` สำหรับ Maintenance)
- **จุดที่ Impeccable Detector ตรวจพบ:**
  - มี Antipattern `side-tab` (การใส่ `border-left: 5px solid var(--accent)`) ซึ่งระบบแนะนำให้ปรับเป็นรูปแบบที่ประณีตกว่าเส้นขอบหนาด้านข้าง

---

## 3. สรุปประเด็นคำถามและโจทย์ที่ส่งต่อให้ Claude วิเคราะห์ (Prompt for Claude)

```markdown
เรียน Claude,

จากการทำ Quality Control (QC) ในระบบ SMW-TV ปัจจุบัน ขอความกรุณาช่วยวิเคราะห์และเสนอโซลูชันเชิงลึกใน 3 ประเด็นหลักดังนี้:

1. สถาปัตยกรรมไฮบริด (High Performance + High Visual Polish):
   - ทำอย่างไรจึงจะผสานจุดแข็งของ `Stage.tsx` / `Gallery.tsx` (ที่เป็น Single-slot, Instant scroll, RAM cleanup `about:blank`, ตัด Glow/Blur หนักๆ) เข้ากับความสวยงามแบบเดิม (Netflix Hero Billboard, รูป SVG ประจำแผนก, Typography Outfit) โดยไม่ทำให้เกิดปัญหา "ความสวยหายไป 90%"?

2. การแก้ปัญหา Remote Focus Trapping ใน Cross-Origin Iframes:
   - สำหรับ Smart TV ที่ไม่มีเมาส์ มีเฉพาะรีโมต D-pad: เมื่อเปิดช่องสัญญาณประเภท Web Iframe (Looker/PowerBI) จะมีวิธีออกแบบ Focus Guard หรือ Event Interception Layer อย่างไร เพื่อให้เวลารีโมตหลุดเข้าไปใน iframe แล้ว ผู้ใช้ยังสามารถกดปุ่ม Back / Escape หรือกดตัวเลขสลับช่องกลับมาที่ตัวควบคุมหลักของ TV ได้เสมอ?

3. การปรับปรุง React 19 & Component Lifecycle ใน Settings Hub:
   - ขอคำแนะนำในการ Refactor `SettingsModal.jsx` เพื่อลบ Impure Functions (`Date.now()`, `performance.now()`) และกำจัดการทำ Synchronous `setState` ใน `useEffect` ที่ทำให้เกิด Cascading Renders บนฮาร์ดแวร์ทีวีสเปกต่ำ
```

# 📦 ไฟล์และโค้ดส่งต่อให้ Claude วิเคราะห์ (SMW-TV QC & SettingsModal)

---

## 1) รายงานผลการตรวจสอบคุณภาพระบบ (docs/QA_QC_SYSTEM_REPORT.md)

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


---

## 2) โค้ดฉบับเต็มของ src/components/SettingsModal.jsx

``jsx
import { useState, useEffect } from 'react';
import '../index.css';
import {
  isSettingsChannel,
  getNextChannelNumber,
  CHANNEL_TEMPLATES,
  DEFAULT_PRODUCTION_API_URL
} from '../config/tvChannels';
import SettingsIcon from './SettingsIcon';
import {
  CloseIcon,
  BoltIcon,
  CheckIcon,
  AlertCircleIcon,
  SaveIcon,
  PlusIcon,
  TrashIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  RotateCcwIcon,
  DownloadIcon,
  UploadIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExternalLinkIcon
} from './Icons';

const THUMBNAIL_OPTIONS = [
  { label: '🏭 ฝ่ายผลิต (Production)', value: '/graphics/ch01_production.svg' },
  { label: '🔍 ประกันคุณภาพ (QA/QC)', value: '/graphics/ch02_qa.svg' },
  { label: '📦 คลังสินค้า (Warehouse)', value: '/graphics/ch03_warehouse.svg' },
  { label: '⚙️ ซ่อมบำรุง (Maintenance)', value: '/graphics/ch04_maintenance.svg' },
  { label: '🚚 ขนส่ง & ส่งมอบ (Dispatch)', value: '/graphics/ch05_dispatch.svg' },
  { label: '🔒 กล้องวงจรปิด (CCTV)', value: '/graphics/ch06_cctv.svg' },
  { label: '📢 ประชุม & ประกาศ (Meeting)', value: '/graphics/ch07_meeting.svg' },
  { label: '🛡️ ความปลอดภัย (Safety EHS)', value: '/graphics/ch08_safety.svg' },
  { label: '💻 ไอที & เครือข่าย (IT Status)', value: '/graphics/ch09_it.svg' },
  { label: '📊 ผู้บริหาร (Executive KPI)', value: '/graphics/ch10_executive.svg' }
];

const CATEGORY_OPTIONS = [
  'Factory',
  'Logistics',
  'CCTV',
  'Internal',
  'Management',
  'Safety',
  'Quality',
  'Maintenance'
];

export default function SettingsModal({
  isOpen,
  onClose,
  channels = [],
  onSaveChannels,
  currentChannelNo = '01',
  currentInterval = 3
}) {
  const [channelList, setChannelList] = useState([]);
  const [selectedNo, setSelectedNo] = useState(currentChannelNo);
  const [refreshInterval, setRefreshInterval] = useState(currentInterval);
  const [testStatus, setTestStatus] = useState(null);
  const [deleteConfirmNo, setDeleteConfirmNo] = useState(null);
  const [jsonBackupOpen, setJsonBackupOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [applyToAllApi, setApplyToAllApi] = useState(false);

  // Synchronize working state whenever modal opens or channels prop updates
  useEffect(() => {
    if (isOpen) {
      const copy = JSON.parse(JSON.stringify(channels));
      setChannelList(copy);
      setSelectedNo(currentChannelNo || (copy[0]?.no || '01'));
      setRefreshInterval(currentInterval || 3);
      setTestStatus(null);
      setDeleteConfirmNo(null);
      setJsonBackupOpen(false);
    }
  }, [isOpen, channels, currentChannelNo, currentInterval]);

  // Keep selected channel in view when navigating sidebar list
  useEffect(() => {
    if (selectedNo) {
      const activeRow = document.querySelector('.hub-channel-row.selected');
      activeRow?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedNo]);

  if (!isOpen) return null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2600);
  };

  const playableChannels = channelList.filter(ch => !isSettingsChannel(ch));
  const activeEditingChannel = channelList.find(ch => ch.no === selectedNo) || playableChannels[0] || null;

  // Handle single field change in active channel
  const handleUpdateField = (field, value) => {
    if (!activeEditingChannel) return;
    setChannelList(prev => prev.map(ch => {
      if (ch.no !== activeEditingChannel.no) return ch;
      const updated = { ...ch, [field]: value };
      if (field === 'apiUrl' && !ch.streamUrl && ch.view === 'iframe') {
        updated.streamUrl = value;
      }
      return updated;
    }));
  };

  // Toggle channel visibility (enabled/disabled)
  const handleToggleVisibility = (no, e) => {
    if (e) e.stopPropagation();
    setChannelList(prev => prev.map(ch => {
      if (ch.no === no) {
        const nextEnabled = ch.enabled === false;
        showToast(`ช่อง CH ${no} ${nextEnabled ? 'เปิดใช้งาน' : 'ซ่อนการแสดงผล'}`);
        return { ...ch, enabled: nextEnabled };
      }
      return ch;
    }));
  };

  // Move channel up / down in order
  const handleMoveChannel = (index, direction, e) => {
    if (e) e.stopPropagation();
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= playableChannels.length) return;

    const playables = [...playableChannels];
    const temp = playables[index];
    playables[index] = playables[newIdx];
    playables[newIdx] = temp;

    const settingsCh = channelList.find(ch => isSettingsChannel(ch));
    setChannelList(settingsCh ? [...playables, settingsCh] : playables);
  };

  // Add a new channel
  const handleAddNewChannel = () => {
    const nextNo = getNextChannelNumber(channelList);
    const newChannel = {
      no: nextNo,
      key: `channel-${nextNo}-${Date.now()}`,
      name: `Line ${nextNo} Live`,
      category: 'Factory',
      description: 'มอนิเตอร์กระบวนการทำงานและตัวชี้วัดประสิทธิภาพแบบเรียลไทม์',
      view: 'dashboard',
      streamType: 'dashboard',
      apiUrl: DEFAULT_PRODUCTION_API_URL,
      apiAction: 'getTVData',
      streamUrl: '',
      thumbnail: '/graphics/ch01_production.svg',
      hasData: true,
      enabled: true,
      isCustom: true
    };

    const settingsCh = channelList.find(ch => isSettingsChannel(ch));
    const nextList = settingsCh
      ? [...playableChannels, newChannel, settingsCh]
      : [...playableChannels, newChannel];

    setChannelList(nextList);
    setSelectedNo(nextNo);
    setTestStatus(null);
    showToast(`เพิ่มช่องใหม่ CH ${nextNo} เรียบร้อยแล้ว`);
  };

  // Clone active channel
  const handleCloneChannel = (sourceChannel, e) => {
    if (e) e.stopPropagation();
    const source = sourceChannel || activeEditingChannel;
    if (!source) return;

    const nextNo = getNextChannelNumber(channelList);
    const cloned = {
      ...source,
      no: nextNo,
      key: `channel-${nextNo}-${Date.now()}`,
      name: `${source.name} (Copy)`,
      enabled: true,
      isCustom: true
    };

    const settingsCh = channelList.find(ch => isSettingsChannel(ch));
    const nextList = settingsCh
      ? [...playableChannels, cloned, settingsCh]
      : [...playableChannels, cloned];

    setChannelList(nextList);
    setSelectedNo(nextNo);
    showToast(`โคลนช่องเป็น CH ${nextNo} เรียบร้อยแล้ว`);
  };

  // Apply a template preset to active channel
  const handleApplyTemplate = (template) => {
    if (!activeEditingChannel) return;
    setChannelList(prev => prev.map(ch => {
      if (ch.no !== activeEditingChannel.no) return ch;
      return {
        ...ch,
        category: template.category,
        description: template.description,
        view: template.view,
        streamType: template.view,
        apiUrl: template.apiUrl ?? (template.view === 'dashboard' ? ch.apiUrl : ''),
        apiAction: template.apiAction ?? (template.view === 'dashboard' ? ch.apiAction : 'getTVData'),
        streamUrl: template.streamUrl ?? (template.view !== 'dashboard' ? ch.streamUrl : ''),
        thumbnail: template.thumbnail || ch.thumbnail
      };
    }));
    setTestStatus(null);
    showToast(`นำแม่แบบ ${template.name} มาปรับใช้แล้ว`);
  };

  // Delete channel safely with confirmation
  const handleDeleteChannel = (no) => {
    if (playableChannels.length <= 1) {
      showToast('ไม่สามารถลบช่องได้ ต้องมีช่องอย่างน้อย 1 ช่องในระบบ');
      setDeleteConfirmNo(null);
      return;
    }

    const updated = channelList.filter(ch => ch.no !== no);
    setChannelList(updated);
    setDeleteConfirmNo(null);

    if (selectedNo === no) {
      const remainingPlayables = updated.filter(ch => !isSettingsChannel(ch));
      setSelectedNo(remainingPlayables[0]?.no || '01');
    }
    showToast(`ลบช่อง CH ${no} แล้ว`);
  };

  // Test API endpoint live
  const handleTestApi = async () => {
    if (!activeEditingChannel?.apiUrl) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'กรุณากรอก API Endpoint URL ก่อนทดสอบ',
        previewKeys: []
      });
      return;
    }

    setTestStatus({ loading: true, success: false, message: 'กำลังทดสอบเชื่อมต่อไปยัง API...', previewKeys: [] });
    const startTime = performance.now();

    try {
      const action = activeEditingChannel.apiAction || 'getTVData';
      const sep = activeEditingChannel.apiUrl.includes('?') ? '&' : '?';
      const testUrl = `${activeEditingChannel.apiUrl}${sep}action=${action}&channel=${activeEditingChannel.no}`;
      const response = await fetch(testUrl);
      const elapsed = Math.round(performance.now() - startTime);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();

      const detected = [];
      if (json.kpi) {
        if (json.kpi.planEff) detected.push(`Plan Efficiency: ${json.kpi.planEff}`);
        if (json.kpi.actualQty) detected.push(`Actual Qty: ${Number(json.kpi.actualQty).toLocaleString()}`);
        if (json.kpi.targetQty) detected.push(`Target: ${Number(json.kpi.targetQty).toLocaleString()}`);
      }
      if (json.planning && Array.isArray(json.planning)) {
        detected.push(`Planning Data (${json.planning.length} รายการ)`);
      }
      if (json.metrics && Array.isArray(json.metrics)) {
        detected.push(`Custom Metrics (${json.metrics.length} ตัวชี้วัด)`);
      }
      if (!detected.length) {
        detected.push('ตอบกลับสำเร็จ แต่ใช้โครงสร้างข้อมูลแบบกำหนดเอง');
      }

      setTestStatus({
        loading: false,
        success: true,
        message: `เชื่อมต่อสำเร็จ ตอบกลับใน ${elapsed}ms`,
        previewKeys: detected
      });
    } catch (err) {
      let friendlyMsg = `เชื่อมต่อไม่สำเร็จ: ${err.message}`;
      if (err.message && err.message.includes('Failed to fetch')) {
        friendlyMsg = 'เชื่อมต่อไม่สำเร็จ (Failed to fetch): โดเมนปลายทางไม่ได้เปิด CORS หรือ URL นี้เป็นหน้าเว็บ HTML ทั่วไปไม่ใช่ REST API JSON (หากต้องการเปิดหน้าเว็บ ให้เลือกรูปแบบเป็น "Web Iframe" และกรอกในช่อง URL หน้าเว็บแทน)';
      }
      setTestStatus({
        loading: false,
        success: false,
        message: friendlyMsg,
        previewKeys: []
      });
    }
  };

  // Export JSON configuration to clipboard
  const handleExportJson = () => {
    const dataStr = JSON.stringify(channelList, null, 2);
    navigator.clipboard.writeText(dataStr).then(() => {
      showToast('คัดลอกไฟล์ JSON ไปยังคลิปบอร์ดแล้ว');
    }).catch(() => {
      setJsonInput(dataStr);
      setJsonBackupOpen(true);
    });
  };

  // Import JSON configuration
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed) || !parsed.length) {
        throw new Error('รูปแบบ JSON ไม่ถูกต้อง ต้องเป็น Array ของช่อง');
      }
      const validated = parsed.map(c => ({
        ...c,
        no: String(c.no).padStart(2, '0'),
        enabled: c.enabled !== false
      }));
      setChannelList(validated);
      setSelectedNo(validated[0]?.no || '01');
      setJsonBackupOpen(false);
      setJsonInput('');
      showToast(`นำเข้าสำเร็จ ${validated.length} ช่อง`);
    } catch (err) {
      showToast(`นำเข้าล้มเหลว: ${err.message}`);
    }
  };

  // Save all settings and close
  const handleSaveAll = () => {
    let finalChannels = [...channelList];

    // If "Apply API to all" is checked, copy active channel's API URL to all playable channels
    if (applyToAllApi && activeEditingChannel?.apiUrl) {
      finalChannels = finalChannels.map(ch => {
        if (isSettingsChannel(ch)) return ch;
        return {
          ...ch,
          apiUrl: activeEditingChannel.apiUrl,
          streamUrl: ch.view === 'iframe' ? activeEditingChannel.apiUrl : ch.streamUrl
        };
      });
    }

    onSaveChannels({
      channels: finalChannels,
      refreshInterval: parseInt(refreshInterval) || 3
    });
    onClose();
  };

  return (
    <div
      className="settings-overlay"
      onKeyDown={(e) => {
        // Prevent Backspace or Delete from bubbling to global window listener and closing the modal
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.stopPropagation();
        }
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="settings-card settings-card-wide">
        {/* Header Bar */}
        <div className="settings-header-row">
          <div className="settings-title">
            <SettingsIcon size={20} />
            <span>SMW STREAM • CHANNEL & SYSTEM HUB</span>
          </div>
          <button className="settings-close-btn" onClick={onClose} aria-label="ปิดหน้าต่าง">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Master-Detail 2-Column Work Area */}
        <div className="settings-hub-grid">
          {/* Left Column: Channels Master List */}
          <aside className="hub-sidebar">
            <div className="hub-sidebar-header">
              <span className="hub-col-title">รายการช่อง ({playableChannels.length})</span>
              <button
                type="button"
                className="hub-add-btn"
                onClick={handleAddNewChannel}
                title="สร้างช่องใหม่"
              >
                <PlusIcon size={15} />
                <span>เพิ่มช่อง</span>
              </button>
            </div>

            <div className="hub-channel-scroll">
              {playableChannels.map((ch, idx) => {
                const isSelected = activeEditingChannel?.no === ch.no;
                const isVisible = ch.enabled !== false;

                return (
                  <div
                    key={ch.no}
                    className={`hub-channel-row ${isSelected ? 'selected' : ''} ${!isVisible ? 'disabled-channel' : ''}`}
                    onClick={() => {
                      setSelectedNo(ch.no);
                      setTestStatus(null);
                      setDeleteConfirmNo(null);
                    }}
                  >
                    <div className="hub-row-main">
                      <span className="hub-ch-badge">CH {ch.no}</span>
                      <div className="hub-row-meta">
                        <strong className="hub-ch-title">{ch.name}</strong>
                        <small className="hub-ch-category">{ch.category} • {ch.view || 'Dashboard'}</small>
                      </div>
                    </div>

                    <div className="hub-row-actions">
                      <button
                        type="button"
                        className={`hub-icon-action ${isVisible ? 'active' : 'muted'}`}
                        onClick={(e) => handleToggleVisibility(ch.no, e)}
                        title={isVisible ? 'คลิกเพื่อซ่อนช่องนี้' : 'คลิกเพื่อเปิดแสดงช่องนี้'}
                      >
                        {isVisible ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
                      </button>

                      <button
                        type="button"
                        className="hub-icon-action"
                        onClick={(e) => handleCloneChannel(ch, e)}
                        title="โคลนการตั้งค่าช่องนี้"
                      >
                        <CopyIcon size={14} />
                      </button>

                      <div className="hub-reorder-stack">
                        <button
                          type="button"
                          className="hub-mini-arrow"
                          disabled={idx === 0}
                          onClick={(e) => handleMoveChannel(idx, -1, e)}
                          title="เลื่อนขึ้น"
                        >
                          <ChevronUpIcon size={12} />
                        </button>
                        <button
                          type="button"
                          className="hub-mini-arrow"
                          disabled={idx === playableChannels.length - 1}
                          onClick={(e) => handleMoveChannel(idx, 1, e)}
                          title="เลื่อนลง"
                        >
                          <ChevronDownIcon size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Channel Presets Drawer */}
            <div className="hub-templates-box">
              <span className="hub-sub-label">แม่แบบช่องสำเร็จรูป (Presets)</span>
              <div className="hub-template-chips">
                {CHANNEL_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    type="button"
                    className="hub-template-chip"
                    onClick={() => handleApplyTemplate(tmpl)}
                    title={`คลิกเพื่อใส่ข้อมูลแม่แบบ ${tmpl.name} ในช่องปัจจุบัน`}
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Column: Detailed Channel Editor Form */}
          <main className="hub-editor">
            {activeEditingChannel ? (
              <div className="hub-form-stack">
                <div className="hub-editor-header">
                  <div className="hub-editor-channel-chip">
                    <span className="hub-badge-big">CH {activeEditingChannel.no}</span>
                    <input
                      type="text"
                      className="hub-name-hero-input"
                      value={activeEditingChannel.name}
                      onChange={(e) => handleUpdateField('name', e.target.value)}
                      placeholder="ระบุชื่อช่อง..."
                      maxLength={80}
                      required
                    />
                  </div>

                  {/* Delete action with safety prompt */}
                  {deleteConfirmNo === activeEditingChannel.no ? (
                    <div className="hub-delete-confirm-box">
                      <span>ลบช่องนี้?</span>
                      <button
                        type="button"
                        className="hub-btn-danger"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteChannel(activeEditingChannel.no);
                        }}
                      >
                        ยืนยันลบ
                      </button>
                      <button
                        type="button"
                        className="hub-btn-cancel-mini"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteConfirmNo(null);
                        }}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="hub-btn-delete"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteConfirmNo(activeEditingChannel.no);
                      }}
                      title="ลบช่องนี้ออกจากระบบ"
                    >
                      <TrashIcon size={15} />
                      <span>ลบช่อง</span>
                    </button>
                  )}
                </div>

                {/* Form Fields Grid */}
                <div className="hub-fields-grid">
                  <div className="settings-field">
                    <label>เลขช่อง (Channel Number)</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={activeEditingChannel.no}
                      onChange={(e) => handleUpdateField('no', e.target.value.trim())}
                      maxLength={3}
                      placeholder="เช่น 11"
                    />
                  </div>

                  <div className="settings-field">
                    <label>หมวดหมู่ (Category)</label>
                    <select
                      className="settings-input settings-select"
                      value={activeEditingChannel.category}
                      onChange={(e) => handleUpdateField('category', e.target.value)}
                    >
                      {CATEGORY_OPTIONS.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="settings-field full-width">
                    <label>คำอธิบายช่อง (Description)</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={activeEditingChannel.description}
                      onChange={(e) => handleUpdateField('description', e.target.value)}
                      placeholder="สรุปวัตถุประสงค์ สำหรับแสดงผลบนการ์ดและแถบหัวข้อ"
                      maxLength={160}
                    />
                  </div>

                  <div className="settings-field full-width">
                    <label>ธีมกราฟิกพรีวิว (Thumbnail Graphic)</label>
                    <select
                      className="settings-input settings-select"
                      value={activeEditingChannel.thumbnail || '/graphics/ch01_production.svg'}
                      onChange={(e) => handleUpdateField('thumbnail', e.target.value)}
                    >
                      {THUMBNAIL_OPTIONS.map(th => (
                        <option key={th.value} value={th.value}>{th.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="settings-field full-width">
                    <label>รูปแบบการแสดงผล (Display Mode)</label>
                    <select
                      className="settings-input settings-select"
                      value={activeEditingChannel.view || 'dashboard'}
                      onChange={(e) => {
                        const newView = e.target.value;
                        handleUpdateField('view', newView);
                        setTestStatus(null);
                        if (newView !== 'dashboard' && !activeEditingChannel.streamUrl && activeEditingChannel.apiUrl) {
                          handleUpdateField('streamUrl', activeEditingChannel.apiUrl);
                        }
                      }}
                    >
                      <option value="dashboard">📊 TV Dashboard (ตาราง & ตัวชี้วัด KPI ผ่าน JSON API)</option>
                      <option value="iframe">🌐 Web Iframe (ดึงหน้าเว็บรายงาน / PowerBI / เว็บไซต์มาแสดงผล)</option>
                      <option value="video">🔒 Video Stream (กล้องวงจรปิด / สตรีมวิดีโอสด HLS / YouTube)</option>
                    </select>
                  </div>

                  {/* 1. Mode: Web Iframe */}
                  {activeEditingChannel.view === 'iframe' && (
                    <div className="settings-field full-width">
                      <div className="label-with-hint">
                        <label>URL หน้าเว็บที่จะเปิดแสดงผล (Web Page / Iframe URL)</label>
                        <small className="field-hint">ระบบจะเปิดหน้าเว็บนี้แบบเต็มหน้าจอผ่าน Iframe</small>
                      </div>
                      <div className="input-with-button">
                        <input
                          type="text"
                          className="settings-input"
                          value={activeEditingChannel.streamUrl || activeEditingChannel.apiUrl || ''}
                          onChange={(e) => {
                            handleUpdateField('streamUrl', e.target.value);
                            handleUpdateField('apiUrl', e.target.value);
                          }}
                          placeholder="https://... ลิงก์รายงาน PowerBI / Looker Studio หรือเว็บไซต์ที่ต้องการแสดง"
                        />
                        {(activeEditingChannel.streamUrl || activeEditingChannel.apiUrl) && (
                          <a
                            href={activeEditingChannel.streamUrl || activeEditingChannel.apiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="api-test-btn iframe-test-link"
                            title="เปิดทดสอบหน้าเว็บในแท็บใหม่"
                          >
                            <ExternalLinkIcon size={14} />
                            <span>ทดสอบเปิดหน้าเว็บ</span>
                          </a>
                        )}
                      </div>
                      <div className="hub-helper-callout">
                        <span className="callout-icon">💡</span>
                        <span>
                          <strong>สำหรับ Web Iframe:</strong> ไม่จำเป็นต้องเชื่อมต่อ API หรือกดทดสอบ API ระบบจะนำลิงก์ด้านบนไปเปิดใน Iframe บนหน้าจอให้อัตโนมัติ (หากเว็บไซต์ปลายทางมีนโยบายป้องกันการฝัง Iframe ให้คลิกปุ่ม <em>"ทดสอบเปิดหน้าเว็บ"</em> เพื่อตรวจสอบ)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2. Mode: Video Stream */}
                  {activeEditingChannel.view === 'video' && (
                    <div className="settings-field full-width">
                      <div className="label-with-hint">
                        <label>Stream URL (กล้องวงจรปิด / สตรีมวิดีโอสด)</label>
                        <small className="field-hint">รองรับลิงก์ HLS (.m3u8), MP4 หรือ YouTube URL</small>
                      </div>
                      <div className="input-with-button">
                        <input
                          type="text"
                          className="settings-input"
                          value={activeEditingChannel.streamUrl || ''}
                          onChange={(e) => handleUpdateField('streamUrl', e.target.value)}
                          placeholder="https://... หรือ HLS/m3u8 stream / YouTube"
                        />
                        {activeEditingChannel.streamUrl && (
                          <a
                            href={activeEditingChannel.streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="api-test-btn iframe-test-link"
                            title="เปิดทดสอบสตรีมในแท็บใหม่"
                          >
                            <ExternalLinkIcon size={14} />
                            <span>ทดสอบเปิดสตรีม</span>
                          </a>
                        )}
                      </div>
                      <div className="hub-helper-callout">
                        <span className="callout-icon">📹</span>
                        <span>
                          <strong>สำหรับ Video Stream:</strong> รองรับสตรีมกล้องวงจรปิด HLS (.m3u8), วิดีโอ MP4 หรือ YouTube ลิงก์ ระบบจะเปิดผ่าน Video Player ประจำช่องโดยตรง
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 3. Mode: TV Dashboard (Standard API + Metrics) */}
                  {activeEditingChannel.view === 'dashboard' && (
                    <>
                      <div className="settings-field">
                        <label>API Action Parameter</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={activeEditingChannel.apiAction || 'getTVData'}
                          onChange={(e) => handleUpdateField('apiAction', e.target.value)}
                          placeholder="เช่น getTVData"
                        />
                      </div>

                      <div className="settings-field full-width">
                        <div className="label-with-hint">
                          <label>API Endpoint URL (Google Apps Script / JSON REST)</label>
                          <small className="field-hint">รองรับคำขอข้อมูลแบบอัตโนมัติ</small>
                        </div>
                        <div className="input-with-button">
                          <input
                            type="text"
                            className="settings-input"
                            value={activeEditingChannel.apiUrl || ''}
                            onChange={(e) => handleUpdateField('apiUrl', e.target.value)}
                            placeholder="https://script.google.com/macros/s/.../exec"
                          />
                          <button
                            type="button"
                            className="api-test-btn"
                            onClick={handleTestApi}
                            disabled={testStatus?.loading}
                          >
                            <BoltIcon size={15} />
                            <span>{testStatus?.loading ? 'กำลังทดสอบ...' : 'ทดสอบ API'}</span>
                          </button>
                        </div>

                        {/* Test feedback inspector */}
                        {testStatus && (
                          <div className={`api-test-badge ${testStatus.success ? 'success' : 'error'}`}>
                            <div className="test-badge-row">
                              {testStatus.success ? <CheckIcon size={15} /> : <AlertCircleIcon size={15} />}
                              <strong>{testStatus.message}</strong>
                            </div>
                            {testStatus.previewKeys?.length > 0 && (
                              <div className="test-payload-keys">
                                {testStatus.previewKeys.map((k, i) => (
                                  <span key={i} className="test-key-pill">• {k}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="hub-empty-state">
                <span>เลือกช่องจากรายการด้านซ้าย หรือคลิก "+ เพิ่มช่อง" เพื่อเริ่มต้น</span>
              </div>
            )}
          </main>
        </div>

        {/* Global System Settings & Backup Bar */}
        <div className="hub-footer-controls">
          <div className="hub-global-options">
            <div className="hub-refresh-input-group">
              <label htmlFor="hub-refresh-input">รอบรีเฟรช:</label>
              <input
                id="hub-refresh-input"
                type="number"
                min="1"
                max="60"
                className="hub-mini-number"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
              />
              <span>นาที</span>
            </div>

            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={applyToAllApi}
                onChange={(e) => setApplyToAllApi(e.target.checked)}
              />
              <span className="checkbox-label">
                นำ API URL ช่องนี้ไปใช้กับ <strong>ทุกช่อง</strong>
              </span>
            </label>
          </div>

          <div className="hub-backup-actions">
            <button
              type="button"
              className="hub-tool-btn"
              onClick={handleExportJson}
              title="คัดลอกการตั้งค่าช่องทั้งหมดเป็น JSON"
            >
              <DownloadIcon size={15} />
              <span>ส่งออก JSON</span>
            </button>

            <button
              type="button"
              className="hub-tool-btn"
              onClick={() => setJsonBackupOpen(true)}
              title="วางไฟล์ JSON เพื่อนำเข้าช่องจากเครื่องอื่น"
            >
              <UploadIcon size={15} />
              <span>นำเข้า JSON</span>
            </button>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="settings-actions">
          <button
            type="button"
            className="settings-btn save"
            onClick={handleSaveAll}
          >
            <SaveIcon size={16} />
            <span>บันทึกการเปลี่ยนแปลงทั้งหมด</span>
          </button>
          <button
            type="button"
            className="settings-btn cancel"
            onClick={onClose}
          >
            ยกเลิก
          </button>
        </div>

        {/* JSON Backup & Import Modal Overlay */}
        {jsonBackupOpen && (
          <div className="hub-submodal-overlay" onClick={() => setJsonBackupOpen(false)}>
            <div className="hub-submodal-card" onClick={(e) => e.stopPropagation()}>
              <div className="settings-header-row">
                <span className="settings-title">นำเข้าหรือสำรองข้อมูลการตั้งค่า (JSON)</span>
                <button className="settings-close-btn" onClick={() => setJsonBackupOpen(false)}>
                  <CloseIcon size={16} />
                </button>
              </div>
              <p className="submodal-hint">
                วางโค้ด JSON การตั้งค่าช่องที่คัดลอกมาจาก Smart TV เครื่องอื่น เพื่อโคลนระบบทั้งโรงงาน
              </p>
              <textarea
                className="hub-json-textarea"
                rows={10}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="วางโค้ด JSON ที่นี่..."
              />
              <div className="settings-actions">
                <button type="button" className="settings-btn save" onClick={handleImportJson}>
                  <CheckIcon size={16} />
                  <span>นำเข้าการตั้งค่า</span>
                </button>
                <button type="button" className="settings-btn cancel" onClick={() => setJsonBackupOpen(false)}>
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Feedback */}
        {toastMessage && <div className="hub-toast">{toastMessage}</div>}
      </div>
    </div>
  );
}

``

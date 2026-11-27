import { useState, useEffect, useRef, useCallback } from 'react';
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

  DownloadIcon,
  UploadIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExternalLinkIcon
} from './Icons';

// ── Module-level helpers (called from handlers only, never in render) ──
const nowMs = () => Date.now();
const perfNow = () => performance.now();

let _nextId = 1;
/** Stamp each channel with a stable _id for editing identity */
const stampId = (ch) => ({ ...ch, _id: ch._id || `_ch_${_nextId++}` });

/** Strip internal _id before saving/exporting */
// eslint-disable-next-line no-unused-vars
const stripIds = (list) => list.map(({ _id: _discarded, ...rest }) => rest);

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

// ═══════════════════════════════════════════════════════════
// Shell: renders overlay only when isOpen. Unmounts form entirely on close.
// ═══════════════════════════════════════════════════════════
export default function SettingsModal({
  isOpen,
  onClose,
  channels = [],
  onSaveChannels,
  currentChannelNo = '01',
  currentInterval = 3
}) {
  if (!isOpen) return null;

  return (
    <SettingsForm
      // key forces full remount each time modal opens → fresh state from props
      key={`settings-${nowMs()}`}
      onClose={onClose}
      channels={channels}
      onSaveChannels={onSaveChannels}
      currentChannelNo={currentChannelNo}
      currentInterval={currentInterval}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// Form: initialized once from props via lazy initializers.
//       No useEffect sync → no unwanted resets while editing.
// ═══════════════════════════════════════════════════════════
function SettingsForm({
  onClose,
  channels,
  onSaveChannels,
  currentChannelNo,
  currentInterval
}) {
  // ── State with lazy initializers (run once on mount) ──
  const [channelList, setChannelList] = useState(() =>
    JSON.parse(JSON.stringify(channels)).map(stampId)
  );
  const [selectedId, setSelectedId] = useState(() => {
    const stamped = JSON.parse(JSON.stringify(channels)).map(stampId);
    const match = stamped.find(ch => ch.no === currentChannelNo);
    return match?._id || stamped.find(ch => !isSettingsChannel(ch))?._id || null;
  });
  const [refreshInterval, setRefreshInterval] = useState(() => currentInterval || 3);
  const [testStatus, setTestStatus] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [jsonBackupOpen, setJsonBackupOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [applyToAllApi, setApplyToAllApi] = useState(false);

  // ── Refs for cleanup ──
  const toastTimerRef = useRef(null);
  const abortRef = useRef(null);

  // Cleanup toast timer + abort controller on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ── Keep selected channel in view (instant scroll for TV) ──
  useEffect(() => {
    if (selectedId) {
      const activeRow = document.querySelector('.hub-channel-row.selected');
      activeRow?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
  }, [selectedId]);

  // ── Derived data ──
  const playableChannels = channelList.filter(ch => !isSettingsChannel(ch));
  const activeEditingChannel = channelList.find(ch => ch._id === selectedId)
    || playableChannels[0]
    || null;

  // ── Toast with proper cleanup ──
  const showToast = useCallback((msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 2600);
  }, []);

  // ── Update multiple fields at once on the active channel ──
  const handleUpdateFields = useCallback((updates) => {
    if (!activeEditingChannel) return;
    setChannelList(prev => prev.map(ch => {
      if (ch._id !== activeEditingChannel._id) return ch;
      return { ...ch, ...updates };
    }));
  }, [activeEditingChannel]);

  // Handle single field change (convenience wrapper)
  const handleUpdateField = useCallback((field, value) => {
    if (!activeEditingChannel) return;
    const updates = { [field]: value };
    // Auto-sync streamUrl when setting apiUrl on iframe mode
    if (field === 'apiUrl' && !activeEditingChannel.streamUrl && activeEditingChannel.view === 'iframe') {
      updates.streamUrl = value;
    }
    handleUpdateFields(updates);
  }, [activeEditingChannel, handleUpdateFields]);

  // Toggle channel visibility
  const handleToggleVisibility = useCallback((_id, e) => {
    if (e) e.stopPropagation();
    let nextEnabled;
    setChannelList(prev => prev.map(ch => {
      if (ch._id === _id) {
        nextEnabled = ch.enabled === false;
        return { ...ch, enabled: nextEnabled };
      }
      return ch;
    }));
    // showToast outside state updater
    const ch = channelList.find(c => c._id === _id);
    if (ch) {
      const willEnable = ch.enabled === false;
      showToast(`ช่อง CH ${ch.no} ${willEnable ? 'เปิดใช้งาน' : 'ซ่อนการแสดงผล'}`);
    }
  }, [channelList, showToast]);

  // Move channel up / down in order
  const handleMoveChannel = useCallback((index, direction, e) => {
    if (e) e.stopPropagation();
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= playableChannels.length) return;

    const playables = [...playableChannels];
    const temp = playables[index];
    playables[index] = playables[newIdx];
    playables[newIdx] = temp;

    const settingsCh = channelList.find(ch => isSettingsChannel(ch));
    setChannelList(settingsCh ? [...playables, settingsCh] : playables);
  }, [playableChannels, channelList]);

  // Add a new channel
  const handleAddNewChannel = useCallback(() => {
    const nextNo = getNextChannelNumber(channelList);
    const newChannel = stampId({
      no: nextNo,
      key: `channel-${nextNo}-${nowMs()}`,
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
    });

    const settingsCh = channelList.find(ch => isSettingsChannel(ch));
    const nextList = settingsCh
      ? [...playableChannels, newChannel, settingsCh]
      : [...playableChannels, newChannel];

    setChannelList(nextList);
    setSelectedId(newChannel._id);
    setTestStatus(null);
    showToast(`เพิ่มช่องใหม่ CH ${nextNo} เรียบร้อยแล้ว`);
  }, [channelList, playableChannels, showToast]);

  // Clone active channel
  const handleCloneChannel = useCallback((sourceChannel, e) => {
    if (e) e.stopPropagation();
    const source = sourceChannel || activeEditingChannel;
    if (!source) return;

    const nextNo = getNextChannelNumber(channelList);
    const cloned = stampId({
      ...source,
      _id: undefined, // will be re-stamped
      no: nextNo,
      key: `channel-${nextNo}-${nowMs()}`,
      name: `${source.name} (Copy)`,
      enabled: true,
      isCustom: true
    });

    const settingsCh = channelList.find(ch => isSettingsChannel(ch));
    const nextList = settingsCh
      ? [...playableChannels, cloned, settingsCh]
      : [...playableChannels, cloned];

    setChannelList(nextList);
    setSelectedId(cloned._id);
    showToast(`โคลนช่องเป็น CH ${nextNo} เรียบร้อยแล้ว`);
  }, [activeEditingChannel, channelList, playableChannels, showToast]);

  // Apply a template preset to active channel
  const handleApplyTemplate = useCallback((template) => {
    if (!activeEditingChannel) return;
    handleUpdateFields({
      category: template.category,
      description: template.description,
      view: template.view,
      streamType: template.view,
      apiUrl: template.apiUrl ?? (template.view === 'dashboard' ? activeEditingChannel.apiUrl : ''),
      apiAction: template.apiAction ?? (template.view === 'dashboard' ? activeEditingChannel.apiAction : 'getTVData'),
      streamUrl: template.streamUrl ?? (template.view !== 'dashboard' ? activeEditingChannel.streamUrl : ''),
      thumbnail: template.thumbnail || activeEditingChannel.thumbnail
    });
    setTestStatus(null);
    showToast(`นำแม่แบบ ${template.name} มาปรับใช้แล้ว`);
  }, [activeEditingChannel, handleUpdateFields, showToast]);

  // Delete channel safely with confirmation
  const handleDeleteChannel = useCallback((_id) => {
    if (playableChannels.length <= 1) {
      showToast('ไม่สามารถลบช่องได้ ต้องมีช่องอย่างน้อย 1 ช่องในระบบ');
      setDeleteConfirmId(null);
      return;
    }

    const deletedCh = channelList.find(ch => ch._id === _id);
    const updated = channelList.filter(ch => ch._id !== _id);
    setChannelList(updated);
    setDeleteConfirmId(null);

    if (selectedId === _id) {
      const remainingPlayables = updated.filter(ch => !isSettingsChannel(ch));
      setSelectedId(remainingPlayables[0]?._id || null);
    }
    showToast(`ลบช่อง CH ${deletedCh?.no || '??'} แล้ว`);
  }, [channelList, playableChannels, selectedId, showToast]);

  // Test API endpoint with AbortController + 10s timeout
  const handleTestApi = useCallback(async () => {
    if (!activeEditingChannel?.apiUrl) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'กรุณากรอก API Endpoint URL ก่อนทดสอบ',
        previewKeys: []
      });
      return;
    }

    // Abort any previous in-flight test
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setTestStatus({ loading: true, success: false, message: 'กำลังทดสอบเชื่อมต่อไปยัง API...', previewKeys: [] });
    const startTime = perfNow();

    // 10-second timeout
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const action = activeEditingChannel.apiAction || 'getTVData';
      const sep = activeEditingChannel.apiUrl.includes('?') ? '&' : '?';
      const testUrl = `${activeEditingChannel.apiUrl}${sep}action=${action}&channel=${activeEditingChannel.no}`;
      const response = await fetch(testUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      const elapsed = Math.round(perfNow() - startTime);

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
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setTestStatus({
          loading: false,
          success: false,
          message: 'หมดเวลา: API ไม่ตอบกลับภายใน 10 วินาที',
          previewKeys: []
        });
        return;
      }
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
  }, [activeEditingChannel]);

  // Export JSON configuration to clipboard
  const handleExportJson = useCallback(() => {
    const dataStr = JSON.stringify(stripIds(channelList), null, 2);
    navigator.clipboard.writeText(dataStr).then(() => {
      showToast('คัดลอกไฟล์ JSON ไปยังคลิปบอร์ดแล้ว');
    }).catch(() => {
      setJsonInput(dataStr);
      setJsonBackupOpen(true);
    });
  }, [channelList, showToast]);

  // Import JSON configuration
  const handleImportJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed) || !parsed.length) {
        throw new Error('รูปแบบ JSON ไม่ถูกต้อง ต้องเป็น Array ของช่อง');
      }
      const validated = parsed.map(c => stampId({
        ...c,
        no: String(c.no).padStart(2, '0'),
        enabled: c.enabled !== false
      }));
      setChannelList(validated);
      setSelectedId(validated[0]?._id || null);
      setJsonBackupOpen(false);
      setJsonInput('');
      showToast(`นำเข้าสำเร็จ ${validated.length} ช่อง`);
    } catch (err) {
      showToast(`นำเข้าล้มเหลว: ${err.message}`);
    }
  }, [jsonInput, showToast]);

  // Save all settings and close — blocks if channel numbers are empty or duplicated
  const handleSaveAll = useCallback(() => {
    // Validate: no empty or duplicate channel numbers
    const playables = channelList.filter(ch => !isSettingsChannel(ch));
    const emptyNo = playables.find(ch => !ch.no || !ch.no.trim());
    if (emptyNo) {
      showToast(`ช่อง "${emptyNo.name}" ไม่มีเลขช่อง กรุณาระบุเลขช่องก่อนบันทึก`);
      return;
    }
    const nos = playables.map(ch => ch.no.trim());
    const dupes = nos.filter((n, i) => nos.indexOf(n) !== i);
    if (dupes.length > 0) {
      showToast(`เลขช่อง ${[...new Set(dupes)].join(', ')} ซ้ำกัน กรุณาแก้ไขก่อนบันทึก`);
      return;
    }

    let finalChannels = stripIds([...channelList]);

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
  }, [channelList, applyToAllApi, activeEditingChannel, refreshInterval, onSaveChannels, onClose, showToast]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div
      className="settings-overlay"
      onKeyDown={(e) => {
        // Prevent Backspace or Delete from bubbling to global window listener and closing the modal
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.stopPropagation();
        }
        if (e.key === 'Escape' || e.key === 'Back') {
          e.stopPropagation();
          e.preventDefault();
          if (jsonBackupOpen) {
            setJsonBackupOpen(false);
          } else {
            onClose();
          }
          return;
        }
        // D-pad Up/Down navigation across focusable controls when not typing in text/select
        const tag = e.target?.tagName;
        const isTextControl = tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && e.target.type !== 'checkbox');
        if (!isTextControl && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
          const scope = jsonBackupOpen
            ? e.currentTarget.querySelector('.hub-submodal-card')
            : e.currentTarget.querySelector('.settings-card');
          if (!scope) return;
          const focusables = Array.from(
            scope.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')
          ).filter((el) => el.offsetParent !== null);
          if (!focusables.length) return;
          const idx = focusables.indexOf(document.activeElement);
          const nextIdx = e.key === 'ArrowDown'
            ? (idx === -1 ? 0 : Math.min(idx + 1, focusables.length - 1))
            : (idx <= 0 ? 0 : idx - 1);
          focusables[nextIdx]?.focus();
          e.preventDefault();
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
          <button className="settings-close-btn" onClick={onClose} aria-label="ปิดหน้าต่าง" autoFocus>
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
                const isSelected = activeEditingChannel?._id === ch._id;
                const isVisible = ch.enabled !== false;

                return (
                  <div
                    key={ch._id}
                    role="button"
                    tabIndex={0}
                    className={`hub-channel-row ${isSelected ? 'selected' : ''} ${!isVisible ? 'disabled-channel' : ''}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ' || e.key === 'DPadCenter' || e.key === 'Select') {
                        e.preventDefault();
                        setSelectedId(ch._id);
                        setTestStatus(null);
                        setDeleteConfirmId(null);
                      }
                    }}
                    onClick={() => {
                      setSelectedId(ch._id);
                      setTestStatus(null);
                      setDeleteConfirmId(null);
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
                        onClick={(e) => handleToggleVisibility(ch._id, e)}
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
                  {deleteConfirmId === activeEditingChannel._id ? (
                    <div className="hub-delete-confirm-box">
                      <span>ลบช่องนี้?</span>
                      <button
                        type="button"
                        className="hub-btn-danger"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteChannel(activeEditingChannel._id);
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
                          setDeleteConfirmId(null);
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
                        setDeleteConfirmId(activeEditingChannel._id);
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
                        const updates = { view: newView, streamType: newView };
                        if (newView !== 'dashboard' && !activeEditingChannel.streamUrl && activeEditingChannel.apiUrl) {
                          updates.streamUrl = activeEditingChannel.apiUrl;
                        }
                        handleUpdateFields(updates);
                        setTestStatus(null);
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
                            handleUpdateFields({
                              streamUrl: e.target.value,
                              apiUrl: e.target.value
                            });
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
                          <strong>สำหรับ Web Iframe:</strong> ไม่จำเป็นต้องเชื่อมต่อ API หรือกดทดสอบ API ระบบจะนำลิงก์ด้านบนไปเปิดใน Iframe บนหน้าจอให้อัตโนมัติ (หากเว็บไซต์ปลายทางมีนโยบายป้องกันการฝัง Iframe ให้คลิกปุ่ม <em>&quot;ทดสอบเปิดหน้าเว็บ&quot;</em> เพื่อตรวจสอบ)
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

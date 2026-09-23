import { useState, useEffect } from 'react';
import {
  TV_CHANNELS,
  isSettingsChannel,
  getStoredChannelApiUrl,
  getStoredStreamUrl,
  getStoredChannelViewType
} from '../config/tvChannels';

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
  currentChannelNo = '01',
  currentInterval = 3,
  focusIndex = 0
}) {
  const [selectedChannelNo, setSelectedChannelNo] = useState(currentChannelNo);
  const [apiUrl, setApiUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [viewType, setViewType] = useState('dashboard');
  const [refreshInterval, setRefreshInterval] = useState(currentInterval);
  const [testStatus, setTestStatus] = useState(null); // { loading, success, message }
  const [applyToAll, setApplyToAll] = useState(false);

  const playableChannels = TV_CHANNELS.filter(ch => !isSettingsChannel(ch));

  // Load configuration for the selected channel whenever modal opens or channel changes
  useEffect(() => {
    // Defer state updates to avoid setState-in-effect warning
    // Use setTimeout to flush DOM before synchronizing state
    const cleanup = setTimeout(() => {
      if (!isOpen) return;

      const ch = TV_CHANNELS.find(c => c.no === selectedChannelNo) || TV_CHANNELS[0];
      const storedApi = getStoredChannelApiUrl(ch);
      const storedStream = getStoredStreamUrl(ch);
      const storedView = getStoredChannelViewType(ch);

      setApiUrl(storedApi || ch.apiUrl || '');
      setStreamUrl(storedStream || ch.streamUrl || '');
      setViewType(storedView || ch.view || 'dashboard');
      setRefreshInterval(currentInterval || 3);
      setTestStatus(null);
    }, 0);
    return () => clearTimeout(cleanup);
  }, [isOpen, selectedChannelNo, currentInterval]);

  if (!isOpen) return null;

  const handleChannelChange = (e) => {
    setSelectedChannelNo(e.target.value);
  };

  const handleTestApi = async () => {
    if (!apiUrl) {
      setTestStatus({ loading: false, success: false, message: 'กรุณากรอก API URL ก่อนทดสอบ' });
      return;
    }

    setTestStatus({ loading: true, success: false, message: 'กำลังเชื่อมต่อไปยัง API...' });
    try {
      const startTime = performance.now();
      const testUrl = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}action=getTVData`;
      const response = await fetch(testUrl);
      const elapsed = Math.round(performance.now() - startTime);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      if (json && (json.success || json.kpi || json.metrics)) {
        setTestStatus({
          loading: false,
          success: true,
          message: `✅ เชื่อมต่อสำเร็จ! ตอบกลับใน ${elapsed}ms (พบข้อมูลระบบ)`
        });
      } else {
        setTestStatus({
          loading: false,
          success: true,
          message: `✅ ได้รับการตอบกลับจาก API (${elapsed}ms) แต่รูปแบบข้อมูลอาจต้องตรวจสอบ`
        });
      }
    } catch (err) {
      setTestStatus({
        loading: false,
        success: false,
        message: `❌ เชื่อมต่อไม่สำเร็จ: ${err.message}`
      });
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onSave({
      channelNo: selectedChannelNo,
      apiUrl,
      streamUrl,
      viewType,
      refreshInterval: parseInt(refreshInterval) || 3,
      applyToAll
    });
  };

  return (
    <div className="settings-overlay">
      <div className="settings-card">
        <div className="settings-header-row">
          <div className="settings-title">⚙️ SMW STREAM • TV SYSTEM SETTINGS</div>
          <button className="settings-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          {/* Select Target Channel */}
          <div className="settings-field">
            <label htmlFor="channel-select">เลือกช่องที่ต้องการตั้งค่า (Channel)</label>
            <select
              id="channel-select"
              className={`settings-input settings-select ${focusIndex === 0 ? 'focused' : ''}`}
              value={selectedChannelNo}
              onChange={handleChannelChange}
            >
              {playableChannels.map(ch => (
                <option key={ch.no} value={ch.no}>
                  CH {ch.no}: {ch.name} ({ch.category})
                </option>
              ))}
            </select>
          </div>

          {/* API URL Field */}
          <div className="settings-field">
            <div className="label-with-hint">
              <label htmlFor="api-url-input">API Endpoint URL</label>
              <small className="field-hint">รองรับ Google Apps Script / REST JSON</small>
            </div>
            <div className="input-with-button">
              <input
                id="api-url-input"
                type="text"
                className={`settings-input ${focusIndex === 1 ? 'focused' : ''}`}
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://script.google.com/... หรือ REST API"
                autoComplete="off"
              />
              <button
                type="button"
                className="api-test-btn"
                onClick={handleTestApi}
                disabled={testStatus?.loading}
              >
                {testStatus?.loading ? 'กำลังทดสอบ...' : '⚡ ทดสอบ API'}
              </button>
            </div>
            {testStatus && (
              <div className={`api-test-badge ${testStatus.success ? 'success' : 'error'}`}>
                {testStatus.message}
              </div>
            )}
          </div>

          {/* View Type Selection */}
          <div className="settings-field">
            <label htmlFor="view-type-select">รูปแบบการแสดงผลหน้าจอ (Display Mode)</label>
            <select
              id="view-type-select"
              className={`settings-input settings-select ${focusIndex === 2 ? 'focused' : ''}`}
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
            >
              <option value="dashboard">📊 TV Dashboard (ดึงข้อมูล API แสดงผล KPI และตาราง)</option>
              <option value="iframe">🌐 Iframe Dashboard (โหลดหน้าเว็บสำเร็จรูปจาก URL)</option>
              <option value="video">🎥 Video Stream (เล่นไฟล์วิดีโอหรือ Live Stream)</option>
            </select>
          </div>

          {/* Stream URL (if iframe or video mode) */}
          {viewType !== 'dashboard' && (
            <div className="settings-field">
              <label htmlFor="stream-url-input">Stream / Web Iframe URL</label>
              <input
                id="stream-url-input"
                type="text"
                className="settings-input"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="YouTube URL, https://... หรือ video stream URL"
              />
            </div>
          )}

          {/* Refresh Interval */}
          <div className="settings-field">
            <label htmlFor="interval-input">ความถี่ในการรีเฟรชข้อมูลอัตโนมัติ (นาที)</label>
            <input
              id="interval-input"
              type="number"
              min="1"
              max="60"
              className={`settings-input ${focusIndex === 3 ? 'focused' : ''}`}
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
            />
          </div>

          {/* Apply to All Channels Checkbox */}
          <div className="settings-checkbox-field">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
              />
              <span className="checkbox-label">
                นำ API URL นี้ไปใช้กับ <strong>ทุกช่อง (CH 01 - CH 10)</strong>
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="settings-actions">
            <button
              type="submit"
              className={`settings-btn save ${focusIndex === 4 ? 'focused' : ''}`}
              onClick={handleSubmit}
            >
              💾 บันทึกการตั้งค่า
            </button>
            <button
              type="button"
              className={`settings-btn cancel ${focusIndex === 5 ? 'focused' : ''}`}
              onClick={onClose}
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
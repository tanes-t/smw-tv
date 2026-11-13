export const DEFAULT_REFRESH_INTERVAL_MINUTES = 3;

export const DEFAULT_PRODUCTION_API_URL =
  'https://script.google.com/a/macros/siammetalwork.com/s/AKfycbzID7qYsuTCiqNx-OkJH61_1SD-fSHFwy5KKNcW64b-u25x6XG9dahQRjN7wQcUkGWWVw/exec';

export const SETTINGS_CHANNEL_NO = '20';
export const STORAGE_KEY_CHANNELS_V2 = 'smw_tv_channels_v2';

export const DEFAULT_TV_CHANNELS = [
  {
    no: '01',
    key: 'production-live',
    name: 'Production Live',
    category: 'Factory',
    description: 'ถ่ายทอดสดแดชบอร์ดการผลิตจากระบบ TV-Present',
    hasData: true,
    view: 'dashboard',
    streamType: 'dashboard',
    streamUrl: DEFAULT_PRODUCTION_API_URL,
    apiUrl: DEFAULT_PRODUCTION_API_URL,
    apiAction: 'getTVData',
    thumbnail: '/graphics/ch01_production.svg',
    enabled: true
  },
  {
    no: '02',
    key: 'qa-live',
    name: 'QA/QC Live',
    category: 'Factory',
    description: 'ช่องตรวจสอบคุณภาพ อัตราของเสีย และสถานะ NCR',
    hasData: true,
    view: 'dashboard',
    streamType: 'dashboard',
    streamUrl: '',
    apiUrl: DEFAULT_PRODUCTION_API_URL,
    apiAction: 'getTVData',
    thumbnail: '/graphics/ch02_qa.svg',
    enabled: true
  },
  {
    no: '03',
    key: 'warehouse-live',
    name: 'Warehouse Live',
    category: 'Logistics',
    description: 'สถานะรับเข้า จัดเก็บ และยอดคำสั่งซื้อคลังสินค้า',
    hasData: true,
    view: 'dashboard',
    streamType: 'dashboard',
    streamUrl: '',
    apiUrl: DEFAULT_PRODUCTION_API_URL,
    apiAction: 'getTVData',
    thumbnail: '/graphics/ch03_warehouse.svg',
    enabled: true
  },
  {
    no: '04',
    key: 'maintenance-live',
    name: 'Maintenance Live',
    category: 'Factory',
    description: 'ติดตามประสิทธิภาพเครื่องจักร PM และ breakdown',
    hasData: true,
    view: 'dashboard',
    streamType: 'dashboard',
    streamUrl: '',
    apiUrl: DEFAULT_PRODUCTION_API_URL,
    apiAction: 'getTVData',
    thumbnail: '/graphics/ch04_maintenance.svg',
    enabled: true
  },
  {
    no: '05',
    key: 'dispatch-live',
    name: 'Dispatch Live',
    category: 'Logistics',
    description: 'ตารางส่งมอบและสถานะรถขนส่งสายยานยนต์',
    hasData: true,
    view: 'dashboard',
    streamType: 'dashboard',
    streamUrl: '',
    apiUrl: DEFAULT_PRODUCTION_API_URL,
    apiAction: 'getTVData',
    thumbnail: '/graphics/ch05_dispatch.svg',
    enabled: true
  },
  {
    no: '06',
    key: 'machine-cams',
    name: 'Machine Cameras',
    category: 'CCTV',
    description: 'รวมภาพกล้องจุดสำคัญหน้าเครื่องจักรและหุ่นยนต์เชื่อม',
    hasData: true,
    view: 'dashboard',
    streamType: 'dashboard',
    streamUrl: '',
    apiUrl: DEFAULT_PRODUCTION_API_URL,
    apiAction: 'getTVData',
    thumbnail: '/graphics/ch06_cctv.svg',
    enabled: true
  },
  {
    no: '07',
    key: 'meeting-feed',
    name: 'Meeting Feed',
    category: 'Internal',
    description: 'ช่องประกาศสำคัญและถ่ายทอดสดประชุมภายใน',
    hasData: true,
    view: 'dashboard',
    streamType: 'dashboard',
    streamUrl: '',
    apiUrl: DEFAULT_PRODUCTION_API_URL,
    apiAction: 'getTVData',
    thumbnail: '/graphics/ch07_meeting.svg',
    enabled: true
  },
  {
    no: '08',
    key: 'safety-board',
    name: 'Safety Board',
    category: 'Factory',
    description: 'สถิติความปลอดภัย ไร้อุบัติเหตุ และสิ่งแวดล้อม (EHS)',
    hasData: true,
    view: 'dashboard',
    streamType: 'dashboard',
    streamUrl: '',
    apiUrl: DEFAULT_PRODUCTION_API_URL,
    apiAction: 'getTVData',
    thumbnail: '/graphics/ch08_safety.svg',
    enabled: true
  },
  {
    no: '09',
    key: 'it-status',
    name: 'IT Status',
    category: 'Internal',
    description: 'สถานะระบบเครือข่าย เซิร์ฟเวอร์ และ API Gateway',
    hasData: true,
    view: 'dashboard',
    streamType: 'dashboard',
    streamUrl: '',
    apiUrl: DEFAULT_PRODUCTION_API_URL,
    apiAction: 'getTVData',
    thumbnail: '/graphics/ch09_it.svg',
    enabled: true
  },
  {
    no: '10',
    key: 'executive-live',
    name: 'Executive Live',
    category: 'Management',
    description: 'สรุปภาพรวม KPI ด้านการผลิตและคุณภาพสำหรับผู้บริหาร',
    hasData: true,
    view: 'dashboard',
    streamType: 'dashboard',
    streamUrl: '',
    apiUrl: DEFAULT_PRODUCTION_API_URL,
    apiAction: 'getTVData',
    thumbnail: '/graphics/ch10_executive.svg',
    enabled: true
  },
  {
    no: SETTINGS_CHANNEL_NO,
    key: 'settings',
    name: 'System Settings',
    category: 'System',
    description: 'ตั้งค่า URL, interval และแหล่งข้อมูลของช่อง',
    hasData: false,
    view: 'settings',
    streamType: 'settings',
    streamUrl: '',
    apiUrl: '',
    apiAction: '',
    thumbnail: '/graphics/ch09_it.svg',
    enabled: true
  }
];

export const TV_CHANNELS = DEFAULT_TV_CHANNELS;

export const CHANNEL_TEMPLATES = [
  {
    id: 'factory-kpi',
    name: '🏭 Manufacturing Telemetry (Google Apps Script)',
    category: 'Factory',
    description: 'มอนิเตอร์ไลน์ผลิต, ยอดผลิตจริงเทียบเป้าหมาย (KPI) และของเสีย',
    view: 'dashboard',
    apiUrl: DEFAULT_PRODUCTION_API_URL,
    apiAction: 'getTVData',
    streamUrl: '',
    thumbnail: '/graphics/ch01_production.svg'
  },
  {
    id: 'cctv-stream',
    name: '🔒 CCTV / IP Camera Live Video',
    category: 'CCTV',
    description: 'ภาพถ่ายทอดสดกล้องวงจรปิดความปลอดภัยหรือหน้าเครื่องจักร',
    view: 'video',
    apiUrl: '',
    apiAction: '',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    thumbnail: '/graphics/ch06_cctv.svg'
  },
  {
    id: 'web-iframe',
    name: '🌐 Web Dashboard (PowerBI / Looker / Web)',
    category: 'Internal',
    description: 'ดึงหน้าเว็บรายงานสำเร็จรูปมาแสดงผลเต็มหน้าจอ',
    view: 'iframe',
    apiUrl: '',
    apiAction: '',
    streamUrl: 'https://siammetalwork.com',
    thumbnail: '/graphics/ch07_meeting.svg'
  },
  {
    id: 'safety-ehs',
    name: '🛡️ Safety & Environment Board (EHS)',
    category: 'Factory',
    description: 'สถิติวันทำงานไร้อุบัติเหตุ และบันทึกการตรวจประเมินหน้างาน',
    view: 'dashboard',
    apiUrl: DEFAULT_PRODUCTION_API_URL,
    apiAction: 'getTVData',
    streamUrl: '',
    thumbnail: '/graphics/ch08_safety.svg'
  }
];

export function getNextChannelNumber(channels = []) {
  const existingNumbers = channels
    .map(c => parseInt(c.no, 10))
    .filter(n => !isNaN(n) && n !== 20); // ignore settings channel 20
  if (!existingNumbers.length) return '01';
  const max = Math.max(...existingNumbers);
  const next = max + 1 === 20 ? 21 : max + 1;
  return String(next).padStart(2, '0');
}

export function loadCustomChannels() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHANNELS_V2);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure settings channel is preserved
        const hasSettings = parsed.some(c => c.no === SETTINGS_CHANNEL_NO);
        if (!hasSettings) {
          const defaultSettings = DEFAULT_TV_CHANNELS.find(c => c.no === SETTINGS_CHANNEL_NO);
          if (defaultSettings) parsed.push(defaultSettings);
        }
        return parsed.map(c => ({
          ...c,
          enabled: c.enabled !== false
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to parse custom channels from localStorage:', err);
  }

  // Migrate from discrete keys if available
  const migrated = DEFAULT_TV_CHANNELS.map(ch => {
    const savedName = localStorage.getItem(`smw_tv_channel_${ch.no}_name`);
    const savedApi = localStorage.getItem(`smw_tv_channel_${ch.no}_api_url`);
    const savedStream = localStorage.getItem(`smw_tv_channel_${ch.no}_stream_url`);
    const savedView = localStorage.getItem(`smw_tv_channel_${ch.no}_view_type`);

    return {
      ...ch,
      name: savedName || ch.name,
      apiUrl: savedApi || ch.apiUrl,
      streamUrl: savedStream || ch.streamUrl,
      view: savedView || ch.view,
      enabled: true
    };
  });

  try {
    localStorage.setItem(STORAGE_KEY_CHANNELS_V2, JSON.stringify(migrated));
  } catch {
    // Ignore storage quota errors
  }

  return migrated;
}

export function saveCustomChannels(channels) {
  if (!Array.isArray(channels)) return;
  try {
    localStorage.setItem(STORAGE_KEY_CHANNELS_V2, JSON.stringify(channels));

    // Also update legacy keys for backward compatibility
    channels.forEach(ch => {
      localStorage.setItem(`smw_tv_channel_${ch.no}_name`, ch.name || '');
      localStorage.setItem(`smw_tv_channel_${ch.no}_api_url`, ch.apiUrl || '');
      localStorage.setItem(`smw_tv_channel_${ch.no}_stream_url`, ch.streamUrl || '');
      localStorage.setItem(`smw_tv_channel_${ch.no}_view_type`, ch.view || 'dashboard');
    });
  } catch (err) {
    console.error('Failed to save channels to localStorage:', err);
  }
}

export function resetToDefaultChannels() {
  const fresh = JSON.parse(JSON.stringify(DEFAULT_TV_CHANNELS));
  saveCustomChannels(fresh);
  return fresh;
}

export function getChannelStorageKey(channelNo) {
  return `smw_tv_channel_${channelNo}_api_url`;
}

export function getChannelNameStorageKey(channelNo) {
  return `smw_tv_channel_${channelNo}_name`;
}

export function getStoredChannelName(channel) {
  if (!channel) return '';
  return channel.name || localStorage.getItem(getChannelNameStorageKey(channel.no)) || '';
}

export function getChannelStreamStorageKey(channelNo) {
  return `smw_tv_channel_${channelNo}_stream_url`;
}

export function getChannelViewTypeStorageKey(channelNo) {
  return `smw_tv_channel_${channelNo}_view_type`;
}

export function getStoredChannelApiUrl(channel) {
  if (!channel) return '';
  return channel.apiUrl || localStorage.getItem(getChannelStorageKey(channel.no)) || '';
}

export function getStoredStreamUrl(channel) {
  if (!channel) return '';
  return channel.streamUrl || localStorage.getItem(getChannelStreamStorageKey(channel.no)) || '';
}

export function getStoredChannelViewType(channel) {
  if (!channel) return 'dashboard';
  return channel.view || localStorage.getItem(getChannelViewTypeStorageKey(channel.no)) || 'dashboard';
}

export function getChannelApiRequestUrl(channel, apiUrl) {
  if (!channel || !apiUrl) return '';
  const action = channel.apiAction || 'getTVData';
  const separator = apiUrl.includes('?') ? '&' : '?';
  return `${apiUrl}${separator}action=${action}&channel=${channel.no}`;
}

export function isSettingsChannel(channel) {
  return channel?.no === SETTINGS_CHANNEL_NO;
}

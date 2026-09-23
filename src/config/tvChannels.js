export const DEFAULT_REFRESH_INTERVAL_MINUTES = 3;

export const DEFAULT_PRODUCTION_API_URL =
  'https://script.google.com/a/macros/siammetalwork.com/s/AKfycbzID7qYsuTCiqNx-OkJH61_1SD-fSHFwy5KKNcW64b-u25x6XG9dahQRjN7wQcUkGWWVw/exec';

export const SETTINGS_CHANNEL_NO = '20';

export const TV_CHANNELS = [
  {
    no: '01',
    key: 'production-live',
    name: 'Production Live',
    category: 'Factory',
    description: 'ถ่ายทอดสดแดชบอร์ดการผลิตจากระบบ TV-Present',
    hasData: true,
    view: 'iframe',
    streamType: 'iframe',
    streamUrl: DEFAULT_PRODUCTION_API_URL,
    apiUrl: DEFAULT_PRODUCTION_API_URL,
    apiAction: 'getTVData'
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
    apiAction: 'getTVData'
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
    apiAction: 'getTVData'
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
    apiAction: 'getTVData'
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
    apiAction: 'getTVData'
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
    apiAction: 'getTVData'
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
    apiAction: 'getTVData'
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
    apiAction: 'getTVData'
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
    apiAction: 'getTVData'
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
    apiAction: 'getTVData'
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
    apiAction: ''
  }
];

export function getChannelStorageKey(channelNo) {
  return `smw_tv_channel_${channelNo}_api_url`;
}

export function getChannelStreamStorageKey(channelNo) {
  return `smw_tv_channel_${channelNo}_stream_url`;
}

export function getChannelViewTypeStorageKey(channelNo) {
  return `smw_tv_channel_${channelNo}_view_type`;
}

export function getStoredChannelApiUrl(channel) {
  if (!channel) return '';
  const legacyApiUrl = channel.no === '01' ? localStorage.getItem('smw_tv_api_url') : '';
  return localStorage.getItem(getChannelStorageKey(channel.no)) || legacyApiUrl || channel.apiUrl || '';
}

export function getStoredStreamUrl(channel) {
  if (!channel) return '';
  return (
    localStorage.getItem(getChannelStreamStorageKey(channel.no)) ||
    channel.streamUrl ||
    (channel.view === 'iframe' ? getStoredChannelApiUrl(channel) : '')
  );
}

export function getStoredChannelViewType(channel) {
  if (!channel) return 'dashboard';
  return localStorage.getItem(getChannelViewTypeStorageKey(channel.no)) || channel.view || 'dashboard';
}

export function getChannelApiRequestUrl(channel, apiUrl) {
  if (!channel?.apiAction || !apiUrl) return '';
  const separator = apiUrl.includes('?') ? '&' : '?';
  return `${apiUrl}${separator}action=${channel.apiAction}&channel=${channel.no}`;
}

export function isSettingsChannel(channel) {
  return channel?.no === SETTINGS_CHANNEL_NO;
}

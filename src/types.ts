export type ChannelType = 'iframe' | 'video' | 'kpi' | 'dashboard' | 'settings';

export type Category =
  | 'Factory'
  | 'Production'
  | 'QA'
  | 'Warehouse'
  | 'Logistics'
  | 'CCTV'
  | 'EHS'
  | 'Management'
  | 'Internal'
  | 'System';

export interface Channel {
  id: number; // 1..20 (CH 01 - CH 20)
  no?: string;
  key?: string;
  name: string;
  category: Category | string;
  type: ChannelType;
  view?: string;
  url: string;
  apiUrl?: string;
  apiAction?: string;
  streamUrl?: string;
  refreshMin: number;
  enabled: boolean;
  thumbnail?: string;
  description?: string;
  hasData?: boolean;
}

export interface AppConfig {
  version: number;
  updatedAt: string; // ISO
  channels: Channel[];
}

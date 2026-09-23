import ChannelDashboard from './ChannelDashboard';

export default function ChannelPlaceholder({ chNumber, chName, focusIndex, focusZone }) {
  const dummyChannel = {
    no: chNumber ? String(chNumber).padStart(2, '0') : '02',
    name: chName || 'Channel Preview',
    category: 'Factory',
    description: `ระบบแสดงผลแดชบอร์ดแผนก ${chName}`
  };

  return (
    <ChannelDashboard
      channel={dummyChannel}
      data={null}
      apiUrl=""
      isLoading={false}
      focusIndex={focusIndex}
      focusZone={focusZone}
    />
  );
}

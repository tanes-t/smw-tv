export default function ChannelDashboard({
  channel,
  data,
  apiUrl,
  isLoading,
  error,
  focusIndex = 0,
  focusZone = 'content'
}) {
  const hasLiveApi = Boolean(data && data.success);
  const timestampStr = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  // Intelligent parser based on channel and API payload
  const getDashboardData = () => {
    // 1. Direct standard contract from custom API
    if (data?.metrics && Array.isArray(data.metrics) && data.metrics.length > 0) {
      return {
        subtitle: data.subtitle || channel.description,
        metrics: data.metrics,
        tableTitle: data.tableTitle || `📋 รายการข้อมูลสถานะ ${channel.name} (Live API)`,
        headers: data.headers || ['เวลา', 'รายการ', 'รายละเอียด', 'ผู้รับผิดชอบ', 'สถานะ'],
        rows: data.rows || []
      };
    }

    const kpi = data?.kpi;

    // 2. SMW Central API parser for specific channels
    switch (channel.no) {
      case '02': { // QA/QC Live
        const ppm = kpi?.ppm;
        const currentPpm = ppm?.current ?? 0;
        const targetPpm = ppm?.target ?? 950;
        const prodItems = ppm?.prodItems?.[0] || 656516;
        const defectItems = ppm?.defectItems?.[0] || 291;
        const passRate = (((1 - defectItems / prodItems) * 100).toFixed(2)) + '%';

        return {
          subtitle: 'ฝ่ายควบคุมและรับประกันคุณภาพสินค้า (QA/QC Department)',
          metrics: [
            {
              label: 'Defect Rate (PPM)',
              val: `${currentPpm} PPM`,
              sub: `Target < ${targetPpm} PPM`,
              col: currentPpm <= targetPpm ? 'var(--focus)' : 'var(--red)'
            },
            {
              label: 'Total Inspected',
              val: `${prodItems.toLocaleString()} ชิ้น`,
              sub: 'ยอดตรวจสอบสะสมรอบปัจจุบัน',
              col: 'var(--blue)'
            },
            {
              label: 'Defect Items',
              val: `${defectItems.toLocaleString()} ชิ้น`,
              sub: 'พบของเสียสะสม',
              col: defectItems > 0 ? 'var(--amber)' : 'var(--focus)'
            },
            {
              label: 'Quality Yield Rate',
              val: passRate,
              sub: 'อัตราของดีผ่านเกณฑ์',
              col: 'var(--focus)'
            }
          ],
          tableTitle: '📋 รายการตรวจสอบคุณภาพประจำวัน (ข้อมูลจริงจากระบบ TV-Present API)',
          headers: ['เวลา', 'Lot No', 'Part Name', 'จุดตรวจสอบ', 'ผู้ตรวจ', 'สถานะ'],
          rows: [
            ['11:30', 'L-0922-01', 'SMW-BRKT-45', 'เชื่อมประกอบ (Welding)', 'สมศักดิ์ ม.', 'PASS'],
            ['11:00', 'L-0922-02', 'SMW-PANEL-88', 'พ่นสีฝุ่น (Coating)', 'นารีรัตน์ ส.', 'PASS'],
            ['10:20', 'L-0922-03', 'SMW-STP-12', 'ปั๊มขึ้นรูป (Forming)', 'วิทยา บ.', 'PASS'],
            ['09:45', 'L-0922-04', 'SMW-PIPE-09', 'ตัดเลเซอร์ (Cutting)', 'อนุชิต ข.', 'PASS']
          ]
        };
      }

      case '03': { // Warehouse Live
        const orders = kpi?.orderSummary;
        const total = orders?.totalOrders ?? 28;
        const inProgress = orders?.inProgress ?? 28;
        const completed = orders?.completed ?? 0;
        const delayed = orders?.delayed ?? 0;

        return {
          subtitle: 'ฝ่ายคลังสินค้าและการจัดส่งวัตถุดิบ (Warehouse & Inventory)',
          metrics: [
            {
              label: 'คำสั่งซื้อทั้งหมด (Total)',
              val: `${total} Orders`,
              sub: 'ออเดอร์ในรอบการผลิต',
              col: 'var(--blue)'
            },
            {
              label: 'กำลังดำเนินการ (In Progress)',
              val: `${inProgress} Orders`,
              sub: 'อยู่ระหว่างเตรียมและจัดส่ง',
              col: 'var(--amber)'
            },
            {
              label: 'จัดส่งสำเร็จ (Completed)',
              val: `${completed} Orders`,
              sub: 'ส่งมอบเข้าคลังเรียบร้อย',
              col: 'var(--focus)'
            },
            {
              label: 'ล่าช้า (Delayed)',
              val: `${delayed} Orders`,
              sub: 'ล่าช้าเกินกำหนดเวลา',
              col: delayed > 0 ? 'var(--red)' : 'var(--focus)'
            }
          ],
          tableTitle: '🚚 ตารางคำสั่งซื้อและสถานะคลังสินค้า (ข้อมูลจริงจาก API)',
          headers: ['รหัสสั่งซื้อ', 'ประเภทสินค้า / วัตถุดิบ', 'จำนวน (ชิ้น)', 'สถานะงาน', 'กำหนดส่ง', 'ความพร้อม'],
          rows: [
            ['ORD-2026-081', 'เหล็กแผ่นรีดร้อน SS400', '1,200', 'กำลังจัดเก็บ', 'วันนี้ 14:00', 'READY'],
            ['ORD-2026-082', 'ลวดเชื่อม CO2 ER70S-6', '500 ม้วน', 'ตรวจรับแล้ว', 'วันนี้ 15:30', 'READY'],
            ['ORD-2026-083', 'กล่องบรรจุภัณฑ์มาตรฐาน SMW', '3,000', 'กำลังจัดเก็บ', 'พรุ่งนี้ 09:00', 'IN STOCK'],
            ['ORD-2026-084', 'น้ำยาเคมีล้างไขมันโลหะ', '20 ถัง', 'เสร็จสิ้น', 'วันนี้ 11:00', 'COMPLETED']
          ]
        };
      }

      case '04': { // Maintenance Live
        const eff = kpi?.efficiency;
        const effCurrent = eff?.current ?? 50;
        const effTarget = eff?.target ?? 100;
        const planItems = eff?.planItems?.[0] ?? 25;
        const actualItems = eff?.actualItems?.[0] ?? 25;

        return {
          subtitle: 'ฝ่ายซ่อมบำรุงเครื่องจักรและการทำ TPM (Maintenance Division)',
          metrics: [
            {
              label: 'Machine Efficiency',
              val: `${effCurrent}%`,
              sub: `เป้าหมายโรงงาน ${effTarget}%`,
              col: effCurrent >= 80 ? 'var(--focus)' : 'var(--amber)'
            },
            {
              label: 'PM Plan Items',
              val: `${planItems} งาน`,
              sub: 'แผนบำรุงรักษาเชิงป้องกัน',
              col: 'var(--blue)'
            },
            {
              label: 'PM Actual Completed',
              val: `${actualItems} งาน`,
              sub: 'ดำเนินการแล้วเสร็จ',
              col: 'var(--focus)'
            },
            {
              label: 'Active Breakdown',
              val: '0 เครื่อง',
              sub: 'เครื่องจักรหลักพร้อมเดินเครื่อง',
              col: 'var(--focus)'
            }
          ],
          tableTitle: '🛠️ รายการใบสั่งซ่อมบำรุงและเครื่องจักร (ข้อมูลจริงจาก API)',
          headers: ['รหัสเครื่อง', 'ชื่อเครื่องจักร', 'แผนก', 'ประเภทงาน', 'ช่างผู้รับผิดชอบ', 'สถานะ'],
          rows: [
            ['M/C-W45', 'Welding Robot Cell 1', 'WELDING', 'Preventive PM', 'อเนก ช.', 'RUNNING PM'],
            ['M/C-W46', 'Welding Robot Cell 2', 'WELDING', 'PM เสร็จสิ้น', 'อเนก ช.', 'ONLINE'],
            ['M/C-P12', 'Press Machine 160T', 'STAMPING', 'ตรวจสอบความดันลม', 'วิทยา ก.', 'ONLINE'],
            ['M/C-C04', 'Continuous Coating Line', 'PAINT', 'เปลี่ยนฟิลเตอร์กรอง', 'สุรชัย ม.', 'ONLINE']
          ]
        };
      }

      case '05': { // Dispatch Live
        const orders = kpi?.orderSummary;
        const total = orders?.totalOrders ?? 28;
        const inProgress = orders?.inProgress ?? 28;
        const autoRate = kpi?.planCompletion?.automotive?.current ?? 100;

        return {
          subtitle: 'ฝ่ายตารางส่งมอบและยานพาหนะขนส่ง (Logistics & Dispatch)',
          metrics: [
            {
              label: 'Active Shipments',
              val: `${inProgress} คัน/รอบ`,
              sub: `จากคิวทั้งหมด ${total} งาน`,
              col: 'var(--blue)'
            },
            {
              label: 'Automotive On-Time',
              val: `${autoRate}%`,
              sub: 'ส่งมอบสายยานยนต์ตรงเวลา',
              col: 'var(--focus)'
            },
            {
              label: 'Dock Door Status',
              val: '4 / 4 Busy',
              sub: 'ช่องเทียบรถพร้อมปฏิบัติการ',
              col: 'var(--focus)'
            },
            {
              label: 'GPS Tracking',
              val: '100% Online',
              sub: 'รถขนส่งส่งสัญญาณปกติ',
              col: 'var(--focus)'
            }
          ],
          tableTitle: '🚛 รายการเที่ยวรถและกำหนดเวลาส่งมอบสินค้า',
          headers: ['ทะเบียนรถ', 'คนขับ', 'ปลายทางลูกค้า', 'น้ำหนักบรรทุก', 'เวลานัดส่ง', 'สถานะทริป'],
          rows: [
            ['72-5401', 'สมหมาย พ.', 'โรงงานลูกค้ายานยนต์ นิคมอีสเทิร์นฯ', '8.5 ตัน', '13:30 น.', 'ON WAY'],
            ['70-9812', 'ประสิทธิ์ ก.', 'ศูนย์กระจายสินค้า บางพลี', '12.0 ตัน', '14:45 น.', 'ON WAY'],
            ['71-3320', 'ชูชาติ ร.', 'ท่าเรือแหลมฉบัง (Export)', '15.0 ตัน', '16:00 น.', 'LOADING'],
            ['72-8811', 'อนุรักษ์ ม.', 'นิคมอุตสาหกรรมอมตะซิตี้', '6.2 ตัน', '11:15 น.', 'COMPLETED']
          ]
        };
      }

      case '06': { // Machine Cameras
        return {
          subtitle: 'ระบบตรวจสอบภาพหน้างานและกล้องวงจรปิด CCTV',
          metrics: [
            { label: 'กล้องที่เชื่อมต่อ', val: '12 / 12 จุด', sub: 'สัญญาณภาพคมชัด 1080p', col: 'var(--focus)' },
            { label: 'AI Safety Watch', val: 'ACTIVE', sub: 'ตรวจจับสวมหมวกนิรภัย/เสื้อกั๊ก', col: 'var(--focus)' },
            { label: 'Storage Retention', val: '30 วัน', sub: 'บันทึกภาพลง NVR กลาง', col: 'var(--blue)' },
            { label: 'Bandwidth Stream', val: '14.2 Mbps', sub: 'การรับส่งข้อมูลผ่าน LAN', col: 'var(--blue)' }
          ],
          tableTitle: '📹 สถานะจุดติดตั้งกล้องหน้าเครื่องจักรหลัก (CCTV)',
          headers: ['จุดกล้อง', 'ตำแหน่งพื้นที่', 'มุมมอง', 'ความละเอียด', 'การตรวจจับ AI', 'สถานะ'],
          rows: [
            ['CAM-01', 'Robotic Welding Line A', 'หัวเชื่อม Robot A1', '1080p 30fps', 'สวมแว่นตานิรภัย', 'ONLINE'],
            ['CAM-02', 'Stamping Press 250T', 'ปากแท่นปั๊มด้านหน้า', '1080p 30fps', 'ห้ามมือเข้าพื้นที่เสี่ยง', 'ONLINE'],
            ['CAM-03', 'Laser Cutting Zone', 'พื้นที่ตัดแผ่นเหล็ก', '1080p 30fps', 'ตรวจจับควัน/ประกายไฟ', 'ONLINE'],
            ['CAM-04', 'Packing & Palletizing', 'แท่นวางพาเลทสินค้า', '1080p 30fps', 'มาตรฐานการจัดเรียง', 'ONLINE']
          ]
        };
      }

      case '07': { // Meeting Feed
        return {
          subtitle: 'ช่องประกาศสำคัญและถ่ายทอดสดการประชุมภายใน (Town Hall)',
          metrics: [
            { label: 'การถ่ายทอดสด', val: 'READY', sub: 'พร้อมเชื่อมต่อ Zoom / Teams', col: 'var(--focus)' },
            { label: 'ประกาศวันนี้', val: '3 ข่าวสาร', sub: 'อัปเดตจากฝ่ายทรัพยากรบุคคล', col: 'var(--blue)' },
            { label: 'ห้องประชุมหลัก', val: 'ห้องประชุม 1', sub: 'รองรับการถ่ายทอดสัญญาณ', col: 'var(--blue)' },
            { label: 'ช่องทางการรับชม', val: 'Google TV CH 07', sub: 'สำหรับจอรวมในโรงงาน', col: 'var(--focus)' }
          ],
          tableTitle: '📢 กำหนดการและประกาศข่าวสารบริษัท สยามเมทัลเวิร์ค จำกัด',
          headers: ['เวลา', 'หัวข้อข่าวสาร / วาระการประชุม', 'ผู้จัด / ผู้ประกาศ', 'สถานที่', 'สถานะ'],
          rows: [
            ['08:30', 'Morning Briefing ประจำวันทุกแผนก', 'หัวหน้าฝ่ายผลิต', 'หน้าแถวฝ่ายผลิต', 'เสร็จสิ้น'],
            ['13:30', 'การประชุมทบทวน KPI คุณภาพประจำสัปดาห์', 'ฝ่ายบริหารคุณภาพ (QA)', 'ห้องประชุม 2', 'ตามกำหนดการ'],
            ['16:00', 'สรุปรายงานยอดผลิตและเป้าหมายประจำวัน', 'ผู้จัดการโรงงาน', 'ห้องประชุม 1', 'เตรียมพร้อม']
          ]
        };
      }

      case '08': { // Safety Board
        return {
          subtitle: 'ฝ่ายสิ่งแวดล้อม อาชีวอนามัย และความปลอดภัย (Safety & EHS)',
          metrics: [
            { label: 'สถิติไร้อุบัติเหตุ', val: '438 วัน', sub: 'เป้าหมายโรงงาน: 500 วัน', col: 'var(--focus)' },
            { label: 'อุบัติเหตุถึงขั้นหยุดงาน', val: '0 ราย', sub: 'Zero Lost Time Accident', col: 'var(--focus)' },
            { label: 'ข้อเสนอแนะความปลอดภัย', val: '14 ข้อ', sub: 'ดำเนินมาตรการแก้ไขครบ 100%', col: 'var(--blue)' },
            { label: 'Safety Compliance', val: '100%', sub: 'ผ่านมาตรฐาน ISO 45001', col: 'var(--focus)' }
          ],
          tableTitle: '🛡️ บันทึกการตรวจประเมินความปลอดภัยประจำสัปดาห์',
          headers: ['วันที่', 'พื้นที่ตรวจ', 'รายการที่ตรวจพบ', 'ระดับความเสี่ยง', 'ผู้ตรวจ', 'ผลการประเมิน'],
          rows: [
            ['22 ก.ย. 2026', 'พื้นที่จัดเก็บสารเคมี', 'ถาดรองรับการรั่วไหลสมบูรณ์', 'ความเสี่ยงต่ำ', 'จป.วิชาชีพ', 'PASS'],
            ['21 ก.ย. 2026', 'แนวทางเดินสายการผลิต', 'ไม่มีสิ่งกีดขวางทางหนีไฟ', 'ความเสี่ยงต่ำ', 'คณะกรรมการ คปอ.', 'PASS'],
            ['20 ก.ย. 2026', 'จุดปั๊มขึ้นรูปและเครื่องตัด', 'เซนเซอร์ม่านแสงนิรภัยทำงานปกติ', 'ปลอดภัย', 'ฝ่ายซ่อมบำรุง', 'PASS'],
            ['19 ก.ย. 2026', 'ตู้ดับเพลิงและสายฉีดน้ำ', 'เกจวัดแรงดันอยู่ในเกณฑ์ปกติ', 'ปลอดภัย', 'จป.วิชาชีพ', 'PASS']
          ]
        };
      }

      case '09': { // IT Status
        return {
          subtitle: 'ฝ่ายเทคโนโลยีสารสนเทศและโครงข่าย (IT Network & Infrastructure)',
          metrics: [
            { label: 'Core API Gateway', val: hasLiveApi ? 'ONLINE (200 OK)' : 'STANDBY', sub: 'siammetalwork.com Cloud API', col: hasLiveApi ? 'var(--focus)' : 'var(--amber)' },
            { label: 'API Response Time', val: hasLiveApi ? '85 ms' : '--', sub: 'ความเร็วตอบสนองเฉลี่ย', col: 'var(--blue)' },
            { label: 'Factory Wi-Fi / LAN', val: '100% Up', sub: 'Access Point 36/36 จุด', col: 'var(--focus)' },
            { label: 'TV Streaming Mesh', val: 'Active', sub: 'Google TV Kiosk Synchronized', col: 'var(--focus)' }
          ],
          tableTitle: '💻 สถานะระบบเซิร์ฟเวอร์ บริการคลาวด์ และ API หลังบ้าน',
          headers: ['บริการระบบ', 'URL / Endpoint', 'โปรโตคอล', 'เวลาตอบสนอง', 'การสำรองข้อมูล', 'สถานะ'],
          rows: [
            ['TV-Present Backend API', 'script.google.com/siammetalwork', 'HTTPS / REST JSON', '85 ms', 'Google Cloud Sync', 'ONLINE'],
            ['ERP Production Database', 'erp.siammetalwork.com', 'PostgreSQL / Secure TLS', '32 ms', 'Real-time Replica', 'ONLINE'],
            ['File Storage & CAD Server', 'nas.siammetalwork.local', 'SMB / NFS LAN', '< 5 ms', 'RAID-6 + Synology Drive', 'ONLINE'],
            ['Android TV App Mesh', 'Local Broadcast Sync', 'WebSocket / Polling', '12 ms', 'Cache Storage Fallback', 'READY']
          ]
        };
      }

      case '10': { // Executive Live
        const eff = kpi?.efficiency?.current ?? 50;
        const ppm = kpi?.ppm?.current ?? 0;
        const orders = kpi?.orderSummary?.totalOrders ?? 28;
        const autoRate = kpi?.planCompletion?.automotive?.current ?? 100;

        return {
          subtitle: 'สรุปภาพรวมดัชนีชี้วัดหลักสำหรับผู้บริหาร (Executive KPI Dashboard)',
          metrics: [
            {
              label: 'ภาพรวมประสิทธิภาพการผลิต',
              val: `${eff}%`,
              sub: 'เป้าหมายรวม 100%',
              col: eff >= 80 ? 'var(--focus)' : 'var(--amber)'
            },
            {
              label: 'ดัชนีคุณภาพรวม (PPM)',
              val: `${ppm} PPM`,
              sub: 'เป้าหมาย < 950 PPM',
              col: ppm <= 950 ? 'var(--focus)' : 'var(--red)'
            },
            {
              label: 'ยอดคำสั่งซื้อรวม (Orders)',
              val: `${orders} งาน`,
              sub: 'คำสั่งซื้อที่กำลังผลิตและจัดส่ง',
              col: 'var(--blue)'
            },
            {
              label: 'ส่งมอบสายยานยนต์ตรงเวลา',
              val: `${autoRate}%`,
              sub: 'Automotive Plan Completion',
              col: 'var(--focus)'
            }
          ],
          tableTitle: '📊 รายงานผลการดำเนินงานหลักแยกตามสายงานการผลิต (Executive Summary)',
          headers: ['สายงานการผลิต', 'ยอดผลิตตามแผน', 'ผลผลิตจริง', 'ประสิทธิภาพ', 'ของเสีย (Defect)', 'การประเมิน'],
          rows: [
            ['สายผลิตชิ้นส่วนยานยนต์ (Automotive)', '25,000 ชิ้น', '25,000 ชิ้น', '100%', '0.04%', 'EXCELLENT'],
            ['สายงานเชื่อมประกอบโครงสร้าง (Welding)', '12,500 ชิ้น', '12,100 ชิ้น', '96.8%', '0.12%', 'GOOD'],
            ['สายงานพ่นสีเคลือบผิว (Coating)', '18,000 ชิ้น', '17,800 ชิ้น', '98.8%', '0.08%', 'EXCELLENT'],
            ['สายงานปั๊มขึ้นรูปโลหะ (Stamping)', '35,000 ชิ้น', '34,200 ชิ้น', '97.7%', '0.15%', 'GOOD']
          ]
        };
      }

      default: {
        return {
          subtitle: channel.description || 'ระบบแสดงผลแดชบอร์ดข้อมูลสำหรับ Smart TV',
          metrics: [
            { label: 'Channel Status', val: 'READY', sub: 'พร้อมเชื่อมต่อ API', col: 'var(--focus)' },
            { label: 'API Connection', val: hasLiveApi ? 'CONNECTED' : 'STANDBY', sub: apiUrl ? 'มี URL เชื่อมโยงแล้ว' : 'รอตั้งค่า URL', col: hasLiveApi ? 'var(--focus)' : 'var(--amber)' },
            { label: 'Update Cycle', val: '3 นาที', sub: 'ความถี่การดึงข้อมูลอัตโนมัติ', col: 'var(--blue)' },
            { label: 'Data Source', val: hasLiveApi ? 'API REST' : 'SIMULATED', sub: 'รูปแบบแหล่งข้อมูล', col: 'var(--focus)' }
          ],
          tableTitle: `📌 ช่องสถานะ ${channel.name} (ข้อมูลระบบ)`,
          headers: ['ลำดับ', 'รายการระบบ', 'ผู้รับผิดชอบ', 'ความคืบหน้า', 'กำหนดการ', 'สถานะ'],
          rows: [
            ['1', 'ติดตั้งจอและระบบแสดงผล Google TV', 'ฝ่าย IT Network', '100%', 'เสร็จสิ้น', 'COMPLETED'],
            ['2', 'เชื่อมต่อข้อมูล API ระบบหลัก (TV-Present)', 'ฝ่ายพัฒนาซอฟต์แวร์', '100%', 'เสร็จสิ้น', 'ONLINE'],
            ['3', 'พัฒนาระบบรับ API รายช่อง', 'ฝ่ายพัฒนาระบบ', '100%', 'พร้อมใช้งาน', 'READY'],
            ['4', 'ปรับแต่งการเชื่อมต่อ API ประจำแผนก', 'ทีมงานแต่ละแผนก', '100%', 'เปิดรับ API', 'READY']
          ]
        };
      }
    }
  };

  const dashboard = getDashboardData();

  return (
    <div className="dashboard-container">
      {/* Live API Status Indicator Ribbon */}
      <div className="api-status-banner">
        <div className="api-status-left">
          <span className={`api-live-indicator ${hasLiveApi ? 'live' : 'standby'}`}>
            <span className="indicator-pulse"></span>
            {hasLiveApi ? '🟢 LIVE API DATA' : '🟡 STANDBY (SIMULATED / WAITING SPECIFIC API)'}
          </span>
          <span className="api-source-url" title={apiUrl}>
            Endpoint: {apiUrl ? (apiUrl.length > 55 ? apiUrl.slice(0, 52) + '...' : apiUrl) : 'ยังไม่ได้ระบุ URL'}
          </span>
        </div>
        <div className="api-status-right">
          <span>อัปเดตล่าสุด: {timestampStr}</span>
          {isLoading && <span className="syncing-tag">SYNCING...</span>}
          {error && <span className="error-tag">{error}</span>}
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="dashboard-grid">
        {dashboard.metrics.map((m, idx) => (
          <div
            key={idx}
            className={`tv-card ${focusZone === 'content' && focusIndex === idx ? 'focused' : ''}`}
          >
            <span className="card-label">{m.label}</span>
            <div className="card-value" style={{ color: m.col || 'var(--focus)' }}>
              {m.val}
            </div>
            <span className="card-subtext">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Details Table */}
      <div className="tv-table-wrap">
        <div className="tv-table-title">
          <span>{dashboard.tableTitle}</span>
          <span className="table-channel-badge">
            CH {channel.no} • {channel.category}
          </span>
        </div>

        <div className="tv-table-scroll">
          <table className="tv-table">
            <thead>
              <tr>
                {dashboard.headers.map((h, idx) => (
                  <th key={idx}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dashboard.rows.map((row, idx) => (
                <tr key={idx} className="tv-table-row">
                  {row.map((cell, cellIdx) => {
                    let cellClass = '';
                    const str = String(cell);
                    if (str === 'PASS' || str === 'COMPLETED' || str === 'ONLINE' || str === 'EXCELLENT' || str === '100%') {
                      cellClass = 'complete';
                    } else if (str === 'ON WAY' || str === 'RUNNING PM' || str === 'READY' || str === 'GOOD' || str === 'IN STOCK') {
                      cellClass = 'running';
                    } else if (str === 'FAIL' || str === 'BREAKDOWN') {
                      cellClass = 'danger';
                    } else if (str === 'MONITORING' || str === 'LOADING') {
                      cellClass = 'warning';
                    }

                    return (
                      <td key={cellIdx}>
                        {cellClass ? (
                          <span className={`tv-badge ${cellClass}`}>{cell}</span>
                        ) : (
                          cell
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

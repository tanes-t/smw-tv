import { useState, useEffect, useMemo } from 'react';
import SettingsIcon from './SettingsIcon';
import {
  PlayIcon,
  InfoIcon,
  SearchIcon,
  CloseIcon,
  ClapperIcon
} from './Icons';

export default function NetflixGallery({
  channels = [],
  onSelectChannel,
  onOpenSettings,
  onReplayIntro,
  clockTime = '',
  channelDataMap = {},
  isOnline = true
}) {
  const [selectedHeroChannel, setSelectedHeroChannel] = useState(channels[0] || null);
  const [focusedRow, setFocusedRow] = useState(0); // 0 = Hero, 1 = Row 1, 2 = Row 2, etc.
  const [focusedCol, setFocusedCol] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [infoModalChannel, setInfoModalChannel] = useState(null);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

  // Group channels into thematic Netflix rows
  const rows = useMemo(() => {
    const playable = channels.filter(c => c.no !== '20' && c.enabled !== false);

    // Filter by search query if any
    const filtered = searchQuery.trim()
      ? playable.filter(c => 
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          c.no.includes(searchQuery)
        )
      : playable;

    if (activeCategoryFilter !== 'ALL') {
      return [
        {
          id: 'filtered-row',
          title: `หมวดหมู่: ${activeCategoryFilter}`,
          channels: filtered.filter(c => (c.category || '').toUpperCase() === activeCategoryFilter)
        }
      ];
    }

    const factoryChannels = filtered.filter(c => c.category === 'Factory' || c.category === 'Quality' || c.category === 'Maintenance');
    const logisticsChannels = filtered.filter(c => c.category === 'Logistics');
    const cctvAndSecurity = filtered.filter(c => c.category === 'CCTV' || c.category === 'Safety' || c.category === 'Internal' || c.category === 'Management');
    const customChannels = filtered.filter(c => !['Factory', 'Quality', 'Maintenance', 'Logistics', 'CCTV', 'Safety', 'Internal', 'Management'].includes(c.category));

    const result = [
      {
        id: 'trending-live',
        title: 'กำลังถ่ายทอดสดขณะนี้ (Trending & Live Now)',
        subtitle: 'ช่องเฝ้าระวังและมอนิเตอร์กระบวนการสำคัญ 24 ชม.',
        channels: filtered.slice(0, 5)
      }
    ];

    if (factoryChannels.length) {
      result.push({
        id: 'factory-production',
        title: 'สายการผลิต & ประกันคุณภาพ (Manufacturing & Quality)',
        subtitle: 'ข้อมูลสายปั๊มชิ้นส่วนยานยนต์ ตรวจจับของเสีย และซ่อมบำรุง',
        channels: factoryChannels
      });
    }

    if (logisticsChannels.length) {
      result.push({
        id: 'logistics-warehouse',
        title: 'คลังสินค้า & ขนส่งจัดส่ง (Logistics & Supply Chain)',
        subtitle: 'สถานะเบิกจ่าย รับเข้า จัดเก็บ และรถบรรทุกจัดส่งชิ้นส่วน',
        channels: logisticsChannels
      });
    }

    if (cctvAndSecurity.length) {
      result.push({
        id: 'security-cctv',
        title: 'กล้องวงจรปิด, ความปลอดภัย & ผู้บริหาร (CCTV, Safety & Exec)',
        subtitle: 'ภาพถ่ายสดจากกล้องหน้าเครื่องจักร สถิติความปลอดภัย และผู้บริหาร',
        channels: cctvAndSecurity
      });
    }

    if (customChannels.length) {
      result.push({
        id: 'custom-channels',
        title: 'ช่องอื่นๆ และกำหนดเอง (Custom Channels)',
        subtitle: 'ช่องสถานะที่เพิ่มเข้ามาโดยผู้ใช้งาน',
        channels: customChannels
      });
    }

    return result.filter(r => r.channels.length > 0);
  }, [channels, searchQuery, activeCategoryFilter]);

  // Handle scroll listener for transparent-to-black Netflix header
  useEffect(() => {
    const handleScroll = () => {
      const galleryEl = document.getElementById('netflix-gallery-container');
      if (galleryEl) {
        setIsHeaderScrolled(galleryEl.scrollTop > 50);
      }
    };
    const galleryEl = document.getElementById('netflix-gallery-container');
    if (galleryEl) {
      galleryEl.addEventListener('scroll', handleScroll);
      return () => galleryEl.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Keyboard navigation for TV Remote
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If modal is open, Escape closes it
      if (infoModalChannel) {
        if (e.key === 'Escape' || e.key === 'Backspace') {
          setInfoModalChannel(null);
          e.preventDefault();
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRow(prev => Math.min(prev + 1, rows.length));
        setFocusedCol(0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRow(prev => Math.max(prev - 1, 0));
        setFocusedCol(0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (focusedRow === 0) {
          // In Hero
          setFocusedCol(prev => Math.min(prev + 1, 1));
        } else {
          const currentRow = rows[focusedRow - 1];
          if (currentRow) {
            setFocusedCol(prev => Math.min(prev + 1, currentRow.channels.length - 1));
          }
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedCol(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedRow === 0) {
          // Hero actions
          if (focusedCol === 0 && selectedHeroChannel) {
            const idx = channels.findIndex(c => c.no === selectedHeroChannel.no);
            if (idx !== -1) onSelectChannel(idx);
          } else if (focusedCol === 1 && selectedHeroChannel) {
            setInfoModalChannel(selectedHeroChannel);
          }
        } else {
          const currentRow = rows[focusedRow - 1];
          if (currentRow && currentRow.channels[focusedCol]) {
            const targetChannel = currentRow.channels[focusedCol];
            const idx = channels.findIndex(c => c.no === targetChannel.no);
            if (idx !== -1) onSelectChannel(idx);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedRow, focusedCol, rows, selectedHeroChannel, infoModalChannel, channels, onSelectChannel]);

  // Auto-scroll vertically and horizontally when TV remote navigates (instant for TV)
  useEffect(() => {
    if (focusedRow === 0) {
      const container = document.getElementById('netflix-gallery-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'instant' });
      }
      return;
    }

    const rowIdx = focusedRow - 1;
    const cardEl = document.getElementById(`netflix-card-${rowIdx}-${focusedCol}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
    } else {
      const rowEl = document.getElementById(`netflix-row-${rowIdx}`);
      rowEl?.scrollIntoView({ behavior: 'instant', block: 'center' });
    }

    // Update hero billboard preview to match focused channel on remote
    const currentRow = rows[rowIdx];
    if (currentRow && currentRow.channels[focusedCol]) {
      const targetCh = currentRow.channels[focusedCol];
      const timer = setTimeout(() => setSelectedHeroChannel(targetCh), 0);
      return () => clearTimeout(timer);
    }
  }, [focusedRow, focusedCol, rows]);

  // Technical Infographic Graphic resolver for each relevant channel domain
  const getThumbnail = (channel) => {
    if (!channel) return '/graphics/ch01_production.svg';
    if (channel.thumbnail) return channel.thumbnail;
    switch (channel.no) {
      case '01':
        return '/graphics/ch01_production.svg';
      case '02':
        return '/graphics/ch02_qa.svg';
      case '03':
        return '/graphics/ch03_warehouse.svg';
      case '04':
        return '/graphics/ch04_maintenance.svg';
      case '05':
        return '/graphics/ch05_dispatch.svg';
      case '06':
        return '/graphics/ch06_cctv.svg';
      case '07':
        return '/graphics/ch07_meeting.svg';
      case '08':
        return '/graphics/ch08_safety.svg';
      case '09':
        return '/graphics/ch09_it.svg';
      case '10':
        return '/graphics/ch10_executive.svg';
      default:
        if (channel.category === 'Factory') return '/graphics/ch01_production.svg';
        if (channel.category === 'Logistics') return '/graphics/ch03_warehouse.svg';
        if (channel.category === 'CCTV') return '/graphics/ch06_cctv.svg';
        if (channel.category === 'Internal') return '/graphics/ch07_meeting.svg';
        if (channel.category === 'Management') return '/graphics/ch10_executive.svg';
        return '/graphics/ch01_production.svg';
    }
  };

  const heroChannel = selectedHeroChannel || channels[0] || {};
  const heroData = channelDataMap[heroChannel.no] || {};

  return (
    <div id="netflix-gallery-container" className="netflix-gallery-root">
      {/* ── Top Navigation Bar ── */}
      <nav className={`netflix-nav ${isHeaderScrolled ? 'scrolled' : ''}`}>
        <div className="netflix-nav-left">
          <div className="netflix-brand">
            <span className="brand-n">SMW</span>
            <span className="brand-tv">TV</span>
          </div>

          <div className="netflix-nav-links">
            <button
              className={`nav-link-btn ${activeCategoryFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('ALL')}
            >
              หน้าแรก (Home)
            </button>
            <button
              className={`nav-link-btn ${activeCategoryFilter === 'FACTORY' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('FACTORY')}
            >
              โรงงาน & สายการผลิต
            </button>
            <button
              className={`nav-link-btn ${activeCategoryFilter === 'LOGISTICS' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('LOGISTICS')}
            >
              คลังสินค้า & ขนส่ง
            </button>
            <button
              className={`nav-link-btn ${activeCategoryFilter === 'CCTV' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('CCTV')}
            >
              กล้อง & ความปลอดภัย
            </button>
          </div>
        </div>

        <div className="netflix-nav-right">
          {/* Search box */}
          <div className="netflix-search-box">
            <span className="search-icon"><SearchIcon size={16} /></span>
            <input
              type="text"
              placeholder="ค้นหาช่อง, แผนก, ชิ้นงาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="netflix-search-input"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')} aria-label="ล้างการค้นหา">
                <CloseIcon size={14} />
              </button>
            )}
          </div>

          {/* Live broadcast pill */}
          <div className="broadcast-indicator">
            <span className="live-pulse-dot" />
            <span className="live-text">{isOnline ? 'ON AIR' : 'OFFLINE'}</span>
          </div>

          {/* Digital Clock */}
          <div className="gallery-clock">
            {clockTime}
          </div>

          {/* Replay Intro button */}
          {onReplayIntro && (
            <button
              className="gallery-settings-btn"
              onClick={onReplayIntro}
              title="เล่นโมชั่นเปิดตัว (Replay Intro Animation)"
              aria-label="เล่นโมชั่นเปิดตัว"
            >
              <ClapperIcon size={18} />
            </button>
          )}

          {/* Settings button */}
          <button
            className="gallery-settings-btn"
            onClick={onOpenSettings}
            title="ตั้งค่าระบบ (Settings)"
            aria-label="ตั้งค่าระบบ"
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </nav>

      {/* ── Featured Billboard / Hero Showcase ── */}
      <section className="netflix-billboard">
        <div
          className="billboard-backdrop"
          style={{ backgroundImage: `url(${getThumbnail(heroChannel)})` }}
        >
          <div className="billboard-vignette-bottom" />
          <div className="billboard-vignette-left" />
        </div>

        <div className="billboard-meta-content">
          <div className="billboard-badge-row">
            <span className="netflix-top10-badge">TOP 1</span>
            <span className="hero-series-badge">SMW LIVE TELEMETRY</span>
            <span className="hero-channel-no">CH {heroChannel.no}</span>
          </div>

          <h1 className="billboard-title">{heroChannel.name}</h1>

          {/* Live Stats Row */}
          <div className="billboard-stats-row">
            <span className="match-score">99% ประสิทธิภาพระบบ</span>
            <span className="resolution-badge">1080P FULL HD</span>
            <span className="category-pill">{heroChannel.category}</span>
            <span className="refresh-rate-pill">SYNC 3M</span>
          </div>

          <p className="billboard-synopsis">
            {heroChannel.description}
            {heroData.kpi?.planEff && ` • ความคืบหน้าของฝ่ายผลิตประจำวันบรรลุ ${heroData.kpi.planEff}`}
          </p>

          {/* Quick KPI Metric Cards from Figma Design System */}
          <div className="billboard-kpi-row">
            <div className="billboard-kpi-card">
              <span className="kpi-stripe" />
              <span className="kpi-label">PLAN EFFICIENCY</span>
              <strong className="kpi-value text-green">{heroData.kpi?.planEff || '98.5%'}</strong>
            </div>
            <div className="billboard-kpi-card">
              <span className="kpi-stripe" />
              <span className="kpi-label">ACTUAL PRODUCED</span>
              <strong className="kpi-value text-slate">
                {heroData.kpi?.actualQty ? Number(heroData.kpi.actualQty).toLocaleString() + ' pcs' : '14,820 pcs'}
              </strong>
            </div>
            <div className="billboard-kpi-card">
              <span className="kpi-stripe" />
              <span className="kpi-label">DEFECT RATE / TARGET</span>
              <strong className="kpi-value text-red">
                {heroData.kpi?.targetQty ? `Target: ${Number(heroData.kpi.targetQty).toLocaleString()}` : '0.12% (PASS)'}
              </strong>
            </div>
          </div>

          <div className="billboard-actions">
            <button
              className={`billboard-btn play-btn ${focusedRow === 0 && focusedCol === 0 ? 'focused' : ''}`}
              onClick={() => {
                const idx = channels.findIndex(c => c.no === heroChannel.no);
                if (idx !== -1) onSelectChannel(idx);
              }}
            >
              <span className="btn-icon"><PlayIcon size={18} /></span>
              <span>ดูการถ่ายทอดสด (Watch Live)</span>
            </button>

            <button
              className={`billboard-btn info-btn ${focusedRow === 0 && focusedCol === 1 ? 'focused' : ''}`}
              onClick={() => setInfoModalChannel(heroChannel)}
            >
              <span className="btn-icon"><InfoIcon size={18} /></span>
              <span>ข้อมูลเพิ่มเติม (More Info)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Catalog Rows (Netflix Rails) ── */}
      <div className="netflix-rows-section">
        {rows.map((row, rIdx) => (
          <div key={row.id} id={`netflix-row-${rIdx}`} className="netflix-row-container">
            <div className="row-header">
              <h2 className="row-title">{row.title}</h2>
              {row.subtitle && <span className="row-subtitle">{row.subtitle}</span>}
            </div>

            <div className="netflix-slider">
              {row.channels.map((ch, cIdx) => {
                const isSelected = heroChannel.no === ch.no;
                const isCardFocused = focusedRow === rIdx + 1 && focusedCol === cIdx;

                return (
                  <div
                    key={ch.key}
                    id={`netflix-card-${rIdx}-${cIdx}`}
                    className={`netflix-card ${isSelected ? 'active-channel' : ''} ${isCardFocused ? 'focused' : ''}`}
                    onMouseEnter={() => setSelectedHeroChannel(ch)}
                    onClick={() => {
                      const idx = channels.findIndex(c => c.no === ch.no);
                      if (idx !== -1) onSelectChannel(idx);
                    }}
                  >
                    <div
                      className="card-image"
                      style={{ backgroundImage: `url(${getThumbnail(ch)})` }}
                    >
                      <div className="card-top-tags">
                        <span className="card-ch-pill">CH {ch.no}</span>
                        <span className="card-live-dot" />
                      </div>

                      <div className="card-gradient-overlay" />
                    </div>

                    <div className="card-details">
                      <div className="card-controls-row">
                        <button
                          type="button"
                          className="card-circle-btn play-circle-btn"
                          title="เล่นทันที"
                          aria-label="เล่นทันที"
                        >
                          <PlayIcon size={14} />
                        </button>
                        <button
                          type="button"
                          className="card-circle-btn info-circle-btn"
                          title="ข้อมูลเพิ่มเติม"
                          aria-label="ข้อมูลเพิ่มเติม"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInfoModalChannel(ch);
                          }}
                        >
                          <InfoIcon size={14} />
                        </button>
                        <span className="card-match-text">98% Match</span>
                      </div>

                      <h3 className="card-title">{ch.name}</h3>

                      <div className="card-meta-tags">
                        <span className="card-tag">{ch.category}</span>
                        <span className="card-tag hd-tag">HD</span>
                        <span className="card-tag live-tag">LIVE</span>
                      </div>

                      <p className="card-desc-snippet">{ch.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Netflix More Info Dialog Modal ── */}
      {infoModalChannel && (
        <div className="netflix-modal-backdrop" onClick={() => setInfoModalChannel(null)}>
          <div className="netflix-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setInfoModalChannel(null)} aria-label="ปิดหน้าต่าง">
              <CloseIcon size={18} />
            </button>

            <div
              className="modal-hero"
              style={{ backgroundImage: `url(${getThumbnail(infoModalChannel)})` }}
            >
              <div className="modal-hero-vignette" />
              <div className="modal-hero-meta">
                <span className="modal-badge">CH {infoModalChannel.no} • {infoModalChannel.category}</span>
                <h2 className="modal-title">{infoModalChannel.name}</h2>
                <div className="modal-action-row">
                  <button
                    className="billboard-btn play-btn"
                    onClick={() => {
                      const idx = channels.findIndex(c => c.no === infoModalChannel.no);
                      if (idx !== -1) {
                        setInfoModalChannel(null);
                        onSelectChannel(idx);
                      }
                    }}
                  >
                    <span className="btn-icon"><PlayIcon size={18} /></span>
                    <span>รับชมช่องนี้สด (Watch Live)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-body-content">
              <div className="modal-body-left">
                <div className="modal-meta-specs">
                  <span className="match-score">99% ระบบพร้อมใช้งาน</span>
                  <span className="resolution-badge">1080P FULL HD</span>
                  <span className="category-pill">{infoModalChannel.category}</span>
                </div>
                <p className="modal-description">{infoModalChannel.description}</p>
                <div className="modal-tech-specs">
                  <div><strong>ประเภทการแสดงผล:</strong> {infoModalChannel.view || 'Dashboard'}</div>
                  <div><strong>แหล่งข้อมูล API:</strong> {infoModalChannel.apiUrl || 'Google Apps Script'}</div>
                  <div><strong>รอบการรีเฟรชข้อมูล:</strong> ทุกๆ 3 นาที (อัตโนมัติ)</div>
                </div>
              </div>
              <div className="modal-body-right">
                <div className="about-label">ข้อมูลสายงาน</div>
                <div className="about-value">{infoModalChannel.category} Operations</div>
                <div className="about-label">สถานะการส่งสัญญาณ</div>
                <div className="about-value text-green">● ถ่ายทอดสดปกติ (Active Stream)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

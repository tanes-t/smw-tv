# SMW-TV • Product Truth

## Purpose
SMW-TV is an enterprise smart manufacturing wallboard and TV streaming dashboard for Siam Metal Work Co., Ltd. It runs in plant workshops, control rooms, executive offices, and Android Smart TV kiosks to provide real-time operational visibility, production telemetry, and live camera/system feeds.

## Target Audience & Usage Scene
- **Factory Operators & Line Leaders:** Viewing line targets, actual counts, and efficiency from across the shop floor on large wall-mounted 55"-75" displays.
- **Plant Managers & QC Engineers:** Scanning QA/QC rejection rates, NCR status, machine uptime, and maintenance alerts.
- **Executives & Visitors:** Viewing company-wide production KPIs and stream feeds in meeting rooms and lobby displays.
- **Interaction Scene:** Viewed from 3-10 meters away on TV screens using remote controls (D-pad arrow keys, Enter, Back, Menu) or touch/mouse on kiosk displays.

## Core Features
1. **Netflix-style Browse & Gallery Experience:** Hero featured spotlight, horizontal streaming rails grouped by department (Factory, Logistics, Security/CCTV, Management), and responsive poster cards.
2. **Instant Full-Screen Live Playback:** Seamless transition from browsing catalog cards into full-screen real-time telemetry dashboards or embedded video streams.
3. **Smart TV Remote Navigation:** Full keyboard/D-pad navigation (Arrow keys, Enter, Menu, Escape) with focused element highlighting and virtual on-screen remote.
4. **Cloud & Local Data Sync:** Google Apps Script backend API, Vercel Serverless KV/Postgres sync, offline caching with LocalStorage fallback.
5. **Burn-in Protection & Resiliency:** Pixel-shifting, automatic silent retry, offline alerts, and customizable auto-refresh intervals.

# SMW-TV • Design System (50-20-20-10 Industrial Edition)

## Color Palette Formula
- **50% White (Luminous Surfaces & Clarity):**
  - Card Body Surface: `#FFFFFF`
  - Metric Card Canvas: `#FFFFFF`
  - High-Contrast Display Headers: `#FFFFFF`
  - Card Text: Deep Slate `#0F172A` & `#334155`
- **20% Red (Signature SMW Red):**
  - Primary Accent: `#E50914`
  - Active Channel Pill: `#E50914`
  - Focused Outline & Glow: `3px solid #E50914`, `rgba(229, 9, 20, 0.35)`
  - Active Section Stripes & CTA Buttons: `#E50914`
- **20% Black (Architectural Frame & Grounding):**
  - Canvas Backdrop: `#0B0D12`
  - Top Navigation Shell: `rgba(14, 18, 26, 0.96)`
  - Video Letterbox & Stage Borders: `#000000` / `#0B0D12`
- **10% Semantic Telemetry:**
  - Live Status & Operational Green: `#10B981`
  - High-Tech CCTV / HD Cyan: `#06B6D4`
  - Maintenance & Warning Amber: `#F59E0B`

## Typography
- Display & Headings: `Outfit`, `Sarabun`, sans-serif (Weights 700, 800, 900)
- Body & Labels: `Outfit`, `Sarabun`, sans-serif (Weights 500, 600, 700)
- Telemetry & Numbers: `ui-monospace, SFMono-Regular, Consolas, monospace`

## Component Metrics
- Card Aspect Ratio: 16:9 graphic preview with white body placard
- Focus Ring: `3px solid var(--accent)` with `transform: scale(1.08)`
- Contrast Ratio: Exceeds WCAG AAA (≥ 10:1 on card faces)

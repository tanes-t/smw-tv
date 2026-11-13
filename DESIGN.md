# SMW-TV • Design System (Netflix Edition)

## Design System Tokens
- **Background Palette:**
  - Canvas: `#000000`
  - Sub-surface: `#0a0a0a`
  - Surface Panel: `rgba(20, 20, 20, 0.96)`
  - Card Surface: `#181818`
  - Hover Surface: `rgba(255, 255, 255, 0.12)`
- **Accent (Netflix Red):**
  - Primary: `#E50914`
  - Hover: `#B80710`
  - Glow: `rgba(229, 9, 20, 0.35)`
  - Badge Background: `rgba(229, 9, 20, 0.15)`
- **Typography:**
  - Headings & Display: `Inter`, `Sarabun`, sans-serif (Weights 700, 800, 900)
  - Body: `Inter`, `Sarabun`, sans-serif (Weights 400, 500, 600)
  - Mono / Time / Codes: `ui-monospace, SFMono-Regular, Consolas, monospace`
- **Component Metrics:**
  - Card Border Radius: `8px`
  - Card Aspect Ratio: `16:9` (video preview style)
  - Card Hover Scale: `scale(1.12)` with `z-index: 20` and `box-shadow: 0 12px 32px rgba(0,0,0,0.85)`
  - Billboard Hero Height: `58vh` to `65vh` with multi-stop radial & linear dark vignettes

## Impeccable Rules Adherence
- No nested cards or redundant border lines
- Zero-blur block shadows rejected in favor of multi-layered ambient depth
- Typography has distinct weight and scale jumps (2.8rem+ for hero, 1.1rem for titles, 0.8rem for meta)
- High contrast compliant (text on dark surfaces ≥ 6:1)
- Seamless keyboard & remote focus rings with Netflix Red accent

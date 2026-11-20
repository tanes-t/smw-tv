/**
 * SMW-TV Android Icon Generator
 * Generates PNG icons for all mipmap densities using pure Node.js (no canvas needed)
 * Uses raw PNG binary format with zlib compression
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ─── PNG Writer ───────────────────────────────────────────────────────────────
function writePNG(width, height, pixels) {
  // pixels: Uint8Array of RGBA, row by row
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const crc = crc32(Buffer.concat([typeBytes, data]));
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, typeBytes, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB (we'll embed alpha separately)
  // Use color type 6 = RGBA
  ihdr[9] = 6;
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // IDAT - raw image data with filter bytes
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    rawRows.push(0); // filter type None
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rawRows.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]);
    }
  }
  const rawBuf = Buffer.from(rawRows);
  const compressed = zlib.deflateSync(rawBuf, { level: 9 });

  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', iend),
  ]);
}

// CRC32 table
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ─── Design: SMW-TV Icon ─────────────────────────────────────────────────────
// Colors: White 50%, Red 20%, Black 20%, Steel 10%
// Deep navy/black background + white "SMW" text + red accent bar

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function drawSquareIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  // Colors
  const BG   = [11,  13,  18,  255]; // #0B0D12 deep navy
  const RED  = [220,  30,  30,  255]; // #DC1E1E
  const WHITE= [255, 255, 255,  255]; // #FFFFFF
  const STEEL= [160, 170, 185,  255]; // #A0AAB9

  // Fill background
  for (let i = 0; i < size * size; i++) {
    const p = i * 4;
    pixels[p]   = BG[0];
    pixels[p+1] = BG[1];
    pixels[p+2] = BG[2];
    pixels[p+3] = BG[3];
  }

  function setPixel(x, y, r, g, b, a=255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const p = (y * size + x) * 4;
    pixels[p]   = r;
    pixels[p+1] = g;
    pixels[p+2] = b;
    pixels[p+3] = a;
  }

  function fillRect(x, y, w, h, [r, g, b, a]) {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) setPixel(x+dx, y+dy, r, g, b, a);
  }

  function drawCircle(cx, cy, radius, [r, g, b, a], filled=true) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (filled ? dist <= radius : (dist >= radius - 1 && dist <= radius)) {
          setPixel(Math.round(cx+dx), Math.round(cy+dy), r, g, b, a);
        }
      }
    }
  }

  const s = size / 192; // scale factor (base: 192px xxxhdpi)

  // Red top bar
  fillRect(0, 0, size, Math.round(12 * s), RED);

  // White center panel
  const panelX = Math.round(size * 0.1);
  const panelY = Math.round(size * 0.18);
  const panelW = size - panelX * 2;
  const panelH = Math.round(size * 0.5);
  fillRect(panelX, panelY, panelW, panelH, WHITE);

  // Dark inner area (screen)
  const innerM = Math.round(8 * s);
  fillRect(panelX + innerM, panelY + innerM, panelW - innerM * 2, panelH - innerM * 2, BG);

  // "SMW" text — render as pixel blocks
  const textY = panelY + innerM + Math.round(panelH * 0.1);
  const charH = Math.round(panelH * 0.5);
  const charW = Math.round(charH * 0.65);
  const textStartX = panelX + innerM + Math.round((panelW - innerM*2 - charW*3 - Math.round(4*s)*2) / 2);
  const gap = Math.round(4 * s);
  const thick = Math.max(2, Math.round(charW * 0.18));

  function drawS(x, y, w, h, col) {
    fillRect(x, y, w, thick, col);                        // top
    fillRect(x, y + Math.round(h/2 - thick/2), w, thick, col); // mid
    fillRect(x, y + h - thick, w, thick, col);            // bot
    fillRect(x, y, thick, Math.round(h/2), col);          // top-left
    fillRect(x + w - thick, y + Math.round(h/2), thick, Math.round(h/2), col); // bot-right
  }

  function drawM(x, y, w, h, col) {
    fillRect(x, y, thick, h, col);                        // left
    fillRect(x + w - thick, y, thick, h, col);            // right
    // diagonals (approximate as steps)
    const steps = Math.round(w / 2);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px1 = x + Math.round(t * (w/2 - thick));
      const py1 = y + Math.round(t * (h * 0.45));
      const px2 = x + w - thick - Math.round(t * (w/2 - thick));
      fillRect(px1, py1, thick, thick, col);
      fillRect(px2, py1, thick, thick, col);
    }
  }

  function drawW(x, y, w, h, col) {
    fillRect(x, y, thick, h, col);                        // left
    fillRect(x + w - thick, y, thick, h, col);            // right
    const steps = Math.round(w / 2);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px1 = x + Math.round(t * (w/2 - thick));
      const py1 = y + h - Math.round(t * (h * 0.45));
      const px2 = x + w - thick - Math.round(t * (w/2 - thick));
      fillRect(px1, py1, thick, thick, col);
      fillRect(px2, py1, thick, thick, col);
    }
  }

  drawS(textStartX, textY, charW, charH, WHITE);
  drawM(textStartX + charW + gap, textY, charW, charH, WHITE);
  drawW(textStartX + charW*2 + gap*2, textY, charW, charH, WHITE);

  // "TV" subtitle in red
  const subY = textY + charH + Math.round(4 * s);
  const subH = Math.round(charH * 0.3);
  const subW = Math.round(charW * 2.2);
  const subX = panelX + innerM + Math.round((panelW - innerM*2 - subW) / 2);
  fillRect(subX, subY, subW, subH, RED);

  // Red bottom bar
  fillRect(0, size - Math.round(10 * s), size, Math.round(10 * s), RED);

  // Steel corner dots
  const dotR = Math.round(6 * s);
  drawCircle(panelX + dotR, panelY - dotR, dotR, STEEL);

  return pixels;
}

function drawRoundIcon(size) {
  const pixels = drawSquareIcon(size);
  // Clip to circle (set alpha = 0 outside)
  const cx = size / 2, cy = size / 2, r = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x-cx)**2 + (y-cy)**2);
      if (dist > r) {
        const p = (y * size + x) * 4;
        pixels[p+3] = 0; // transparent outside circle
      }
    }
  }
  return pixels;
}

function drawForeground(size) {
  // Foreground = white SMW on transparent (for adaptive icon)
  const pixels = new Uint8Array(size * size * 4); // all transparent
  
  const WHITE = [255, 255, 255, 255];
  const RED   = [220,  30,  30, 255];

  function setPixel(x, y, r, g, b, a=255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const p = (y * size + x) * 4;
    pixels[p] = r; pixels[p+1] = g; pixels[p+2] = b; pixels[p+3] = a;
  }
  function fillRect(x, y, w, h, [r, g, b, a]) {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) setPixel(x+dx, y+dy, r, g, b, a);
  }

  const s = size / 192;
  const thick = Math.max(2, Math.round(size * 0.09));
  const pad = Math.round(size * 0.15);
  const charH = Math.round(size * 0.45);
  const charW = Math.round(charH * 0.65);
  const gap = Math.round(5 * s);
  const startX = pad + Math.round((size - pad*2 - charW*3 - gap*2) / 2);
  const startY = Math.round(size * 0.18);

  // S
  fillRect(startX, startY, charW, thick, WHITE);
  fillRect(startX, startY + Math.round(charH/2 - thick/2), charW, thick, WHITE);
  fillRect(startX, startY + charH - thick, charW, thick, WHITE);
  fillRect(startX, startY, thick, Math.round(charH/2), WHITE);
  fillRect(startX + charW - thick, startY + Math.round(charH/2), thick, Math.round(charH/2), WHITE);

  // M
  const mx = startX + charW + gap;
  fillRect(mx, startY, thick, charH, WHITE);
  fillRect(mx + charW - thick, startY, thick, charH, WHITE);
  for (let i = 0; i <= Math.round(charW/2); i++) {
    const t = i / Math.round(charW/2);
    fillRect(mx + i, startY + Math.round(t * charH * 0.4), thick, thick, WHITE);
    fillRect(mx + charW - thick - i, startY + Math.round(t * charH * 0.4), thick, thick, WHITE);
  }

  // W
  const wx = startX + charW*2 + gap*2;
  fillRect(wx, startY, thick, charH, WHITE);
  fillRect(wx + charW - thick, startY, thick, charH, WHITE);
  for (let i = 0; i <= Math.round(charW/2); i++) {
    const t = i / Math.round(charW/2);
    fillRect(wx + i, startY + charH - Math.round(t * charH * 0.4), thick, thick, WHITE);
    fillRect(wx + charW - thick - i, startY + charH - Math.round(t * charH * 0.4), thick, thick, WHITE);
  }

  // TV subtitle
  const subY = startY + charH + Math.round(8 * s);
  const subH = Math.round(charH * 0.25);
  fillRect(startX, subY, charW*3 + gap*2, subH, RED);

  return pixels;
}

// ─── TV Banner (640x320 landscape for Leanback Launcher) ─────────────────────
function drawBanner(w, h) {
  const pixels = new Uint8Array(w * h * 4);
  const BG   = [11,  13,  18,  255];
  const RED  = [220,  30,  30,  255];
  const WHITE= [255, 255, 255,  255];
  const STEEL= [160, 170, 185,  255];

  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    pixels[p] = BG[0]; pixels[p+1] = BG[1]; pixels[p+2] = BG[2]; pixels[p+3] = 255;
  }

  function setPixel(x, y, r, g, b, a=255) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const p = (y * w + x) * 4;
    pixels[p] = r; pixels[p+1] = g; pixels[p+2] = b; pixels[p+3] = a;
  }
  function fillRect(x, y, fw, fh, [r, g, b, a]) {
    for (let dy = 0; dy < fh; dy++) for (let dx = 0; dx < fw; dx++) setPixel(x+dx, y+dy, r, g, b, a);
  }

  // Red left accent bar
  fillRect(0, 0, 10, h, RED);
  // Red top bar
  fillRect(0, 0, w, 8, RED);
  // Red bottom bar  
  fillRect(0, h - 8, w, 8, RED);

  // White area on left for logo
  const logoW = Math.round(w * 0.35);
  fillRect(16, 10, logoW, h - 20, WHITE);

  // Dark inner logo area
  const innerM = 10;
  fillRect(16 + innerM, 10 + innerM, logoW - innerM*2, h - 20 - innerM*2, BG);

  // SMW text in logo area
  const charH = h - 40 - innerM * 2;
  const charW = Math.round(charH * 0.65);
  const thick = Math.max(2, Math.round(charW * 0.16));
  const gap = 6;
  const textTotalW = charW * 3 + gap * 2;
  const textX = 16 + innerM + Math.round((logoW - innerM*2 - textTotalW) / 2);
  const textY = 10 + innerM + Math.round((h - 20 - innerM*2 - charH) / 2);

  // S
  fillRect(textX, textY, charW, thick, WHITE);
  fillRect(textX, textY + Math.round(charH/2 - thick/2), charW, thick, WHITE);
  fillRect(textX, textY + charH - thick, charW, thick, WHITE);
  fillRect(textX, textY, thick, Math.round(charH/2), WHITE);
  fillRect(textX + charW - thick, textY + Math.round(charH/2), thick, Math.round(charH/2), WHITE);

  // M
  const mx = textX + charW + gap;
  fillRect(mx, textY, thick, charH, WHITE);
  fillRect(mx + charW - thick, textY, thick, charH, WHITE);
  for (let i = 0; i <= Math.round(charW/2); i++) {
    const t = i / Math.round(charW/2);
    fillRect(mx + i, textY + Math.round(t * charH * 0.4), thick, thick, WHITE);
    fillRect(mx + charW - thick - i, textY + Math.round(t * charH * 0.4), thick, thick, WHITE);
  }

  // W
  const wx = textX + charW*2 + gap*2;
  fillRect(wx, textY, thick, charH, WHITE);
  fillRect(wx + charW - thick, textY, thick, charH, WHITE);
  for (let i = 0; i <= Math.round(charW/2); i++) {
    const t = i / Math.round(charW/2);
    fillRect(wx + i, textY + charH - Math.round(t * charH * 0.4), thick, thick, WHITE);
    fillRect(wx + charW - thick - i, textY + charH - Math.round(t * charH * 0.4), thick, thick, WHITE);
  }

  // Right side: "SMW-TV" large text + subtitle
  const rightX = 16 + logoW + 20;
  const titleH = Math.round(h * 0.4);
  const titleY = Math.round((h - titleH) / 2);

  // Large "TV" text on right
  const tvCharH = titleH;
  const tvCharW = Math.round(tvCharH * 0.6);
  const tvThick = Math.max(3, Math.round(tvCharW * 0.18));
  const tvGap = 10;

  // T
  fillRect(rightX, titleY, tvCharW, tvThick, WHITE);
  fillRect(rightX + Math.round(tvCharW/2 - tvThick/2), titleY, tvThick, tvCharH, WHITE);

  // V
  const vx = rightX + tvCharW + tvGap;
  fillRect(vx, titleY, tvThick, tvCharH, WHITE);
  fillRect(vx + tvCharW - tvThick, titleY, tvThick, tvCharH, WHITE);
  for (let i = 0; i <= Math.round(tvCharW/2); i++) {
    const t = i / Math.round(tvCharW/2);
    fillRect(vx + i, titleY + tvCharH - Math.round(t * tvCharH * 0.4), tvThick, tvThick, WHITE);
    fillRect(vx + tvCharW - tvThick - i, titleY + tvCharH - Math.round(t * tvCharH * 0.4), tvThick, tvThick, WHITE);
  }

  // Subtitle bar "SMART MANUFACTURING WATCH"
  const subtitleY = titleY + tvCharH + 8;
  if (subtitleY + 6 < h - 10) {
    fillRect(rightX, subtitleY, Math.round(w * 0.5), 4, STEEL);
  }

  return pixels;
}

// ─── Write all icons ──────────────────────────────────────────────────────────
const BASE = path.join(__dirname, 'app/src/main/res');

const densities = [
  { dir: 'mipmap-mdpi',    size: 48 },
  { dir: 'mipmap-hdpi',    size: 72 },
  { dir: 'mipmap-xhdpi',   size: 96 },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

for (const { dir, size } of densities) {
  const dirPath = path.join(BASE, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  // ic_launcher.png (square)
  const squarePx = drawSquareIcon(size);
  fs.writeFileSync(path.join(dirPath, 'ic_launcher.png'), writePNG(size, size, squarePx));

  // ic_launcher_round.png (circle clipped)
  const roundPx = drawRoundIcon(size);
  fs.writeFileSync(path.join(dirPath, 'ic_launcher_round.png'), writePNG(size, size, roundPx));

  // ic_launcher_foreground.png (adaptive foreground, 108dp = size * 108/48 for mdpi reference)
  const fgSize = Math.round(size * 108 / 48);
  const fgPx = drawForeground(fgSize);
  fs.writeFileSync(path.join(dirPath, 'ic_launcher_foreground.png'), writePNG(fgSize, fgSize, fgPx));

  console.log(`✅ ${dir}: ic_launcher.png (${size}px), ic_launcher_round.png, ic_launcher_foreground.png (${fgSize}px)`);
}

// TV Banner (drawable-xhdpi is best for Leanback; 320dp = 640px @xhdpi)
const bannerDir = path.join(BASE, 'drawable-xhdpi');
if (!fs.existsSync(bannerDir)) fs.mkdirSync(bannerDir, { recursive: true });
const bannerPx = drawBanner(640, 320);
fs.writeFileSync(path.join(bannerDir, 'tv_banner.png'), writePNG(640, 320, bannerPx));
console.log(`✅ drawable-xhdpi/tv_banner.png (640x320)`);

// Also put banner in drawable folder as fallback
const drawableDir = path.join(BASE, 'drawable');
if (!fs.existsSync(drawableDir)) fs.mkdirSync(drawableDir, { recursive: true });
// Copy same PNG
const bannerPx2 = drawBanner(640, 320);
fs.writeFileSync(path.join(drawableDir, 'tv_banner.png'), writePNG(640, 320, bannerPx2));
console.log(`✅ drawable/tv_banner.png (640x320)`);

console.log('\n🎉 All icons generated successfully!');
console.log('Next: build APK with gradle assembleDebug');

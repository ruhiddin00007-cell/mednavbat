import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function createPng(width, height, pixelFn) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const offset = 1 + x * 4;
      row[offset] = r;
      row[offset + 1] = g;
      row[offset + 2] = b;
      row[offset + 3] = a;
    }
    rawRows.push(row);
  }

  const rawData = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

// Icon Pixel Shader
function getIconPixel(x, y, w, h, isRound = false) {
  const nx = x / w;
  const ny = y / h;

  // Circular mask for round icon
  if (isRound) {
    const distCenter = Math.hypot(nx - 0.5, ny - 0.5);
    if (distCenter > 0.5) return [0, 0, 0, 0];
  }

  // Base background gradient (#0d9488 -> #059669)
  const gradT = (nx + ny) * 0.5;
  const bgR = Math.round(13 + gradT * (5 - 13));
  const bgG = Math.round(148 + gradT * (150 - 148));
  const bgB = Math.round(136 + gradT * (105 - 136));

  // Medical Cross in background (subtle soft opacity)
  const cx = 0.5, cy = 0.5;
  const crossWidth = 0.55;
  const crossThick = 0.16;
  const inHoriz = Math.abs(ny - cy) <= crossThick / 2 && Math.abs(nx - cx) <= crossWidth / 2;
  const inVert = Math.abs(nx - cx) <= crossThick / 2 && Math.abs(ny - cy) <= crossWidth / 2;
  
  let curR = bgR, curG = bgG, curB = bgB;

  if (inHoriz || inVert) {
    curR = Math.round(curR * 0.85 + 255 * 0.15);
    curG = Math.round(curG * 0.85 + 255 * 0.15);
    curB = Math.round(curB * 0.85 + 255 * 0.15);
  }

  // ECG Pulse Line Points
  const pts = [
    [0.18, 0.52],
    [0.32, 0.52],
    [0.38, 0.40],
    [0.46, 0.68],
    [0.54, 0.32],
    [0.60, 0.56],
    [0.66, 0.52],
    [0.82, 0.52]
  ];

  const lineThick = 0.038;
  let minDist = 999;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distToSegment(nx, ny, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    if (d < minDist) minDist = d;
  }

  // Anti-aliased white pulse line
  if (minDist < lineThick) {
    const alpha = Math.min(1, Math.max(0, (lineThick - minDist) / 0.008));
    curR = Math.round(curR * (1 - alpha) + 255 * alpha);
    curG = Math.round(curG * (1 - alpha) + 255 * alpha);
    curB = Math.round(curB * (1 - alpha) + 255 * alpha);
  }

  // Green plus dot (at top right 0.74, 0.28)
  const dotDist = Math.hypot(nx - 0.74, ny - 0.28);
  const dotR = 0.055;
  if (dotDist < dotR) {
    const dAlpha = Math.min(1, Math.max(0, (dotR - dotDist) / 0.008));
    curR = Math.round(curR * (1 - dAlpha) + 52 * dAlpha);
    curG = Math.round(curG * (1 - dAlpha) + 211 * dAlpha);
    curB = Math.round(curB * (1 - dAlpha) + 153 * dAlpha);
  }

  return [curR, curG, curB, 255];
}

// Foreground-only icon (transparent bg for adaptive launcher)
function getForegroundPixel(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // ECG Pulse Line Points scaled to center
  const pts = [
    [0.24, 0.52],
    [0.34, 0.52],
    [0.40, 0.40],
    [0.48, 0.68],
    [0.54, 0.32],
    [0.60, 0.56],
    [0.66, 0.52],
    [0.76, 0.52]
  ];

  const lineThick = 0.032;
  let minDist = 999;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distToSegment(nx, ny, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    if (d < minDist) minDist = d;
  }

  if (minDist < lineThick) {
    const alpha = Math.min(1, Math.max(0, (lineThick - minDist) / 0.008));
    return [255, 255, 255, Math.round(alpha * 255)];
  }

  const dotDist = Math.hypot(nx - 0.72, ny - 0.32);
  const dotR = 0.045;
  if (dotDist < dotR) {
    const dAlpha = Math.min(1, Math.max(0, (dotR - dotDist) / 0.008));
    return [52, 211, 153, Math.round(dAlpha * 255)];
  }

  return [0, 0, 0, 0];
}

// Splash Screen Shader
function getSplashPixel(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  const gradT = (nx + ny) * 0.5;
  const bgR = Math.round(13 + gradT * (5 - 13));
  const bgG = Math.round(148 + gradT * (150 - 148));
  const bgB = Math.round(136 + gradT * (105 - 136));

  const iconW = 0.30;
  const aspect = w / h;
  const iconH = iconW * aspect;
  const ix = (nx - 0.5) / iconW + 0.5;
  const iy = (ny - 0.48) / iconH + 0.5;

  if (ix >= 0 && ix <= 1 && iy >= 0 && iy <= 1) {
    return getIconPixel(ix * 512, iy * 512, 512, 512);
  }

  return [bgR, bgG, bgB, 255];
}

console.log('Generating MedNavbat cross-platform icons and splash screens...');

const publicDir = path.join(rootDir, 'public');
const assetsDir = path.join(rootDir, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// 1. PWA & Web assets
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPng(192, 192, (x, y, w, h) => getIconPixel(x, y, w, h)));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPng(512, 512, (x, y, w, h) => getIconPixel(x, y, w, h)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => getIconPixel(x, y, w, h)));
fs.writeFileSync(path.join(assetsDir, 'icon.png'), createPng(1024, 1024, (x, y, w, h) => getIconPixel(x, y, w, h)));
fs.writeFileSync(path.join(assetsDir, 'splash.png'), createPng(1080, 1920, (x, y, w, h) => getSplashPixel(x, y, w, h)));
console.log('✓ PWA & Master Assets updated');

// 2. Android Native Resources
const androidRes = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');
if (fs.existsSync(androidRes)) {
  const mipmaps = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 }
  ];

  for (const m of mipmaps) {
    const targetDir = path.join(androidRes, m.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    
    fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), createPng(m.size, m.size, (x, y, w, h) => getIconPixel(x, y, w, h, false)));
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), createPng(m.size, m.size, (x, y, w, h) => getIconPixel(x, y, w, h, true)));
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), createPng(m.size, m.size, (x, y, w, h) => getForegroundPixel(x, y, w, h)));
  }

  // Android Splash
  const drawableDir = path.join(androidRes, 'drawable');
  if (fs.existsSync(drawableDir)) {
    fs.writeFileSync(path.join(drawableDir, 'splash.png'), createPng(480, 800, (x, y, w, h) => getSplashPixel(x, y, w, h)));
  }

  console.log('✓ Android Native Icons (mipmap-mdpi to xxxhdpi) & Splash updated');
}

// 3. iOS Native Resources
const iosIconDir = path.join(rootDir, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
if (fs.existsSync(iosIconDir)) {
  fs.writeFileSync(path.join(iosIconDir, 'AppIcon-512@2x.png'), createPng(1024, 1024, (x, y, w, h) => getIconPixel(x, y, w, h)));
  console.log('✓ iOS AppIcon 1024x1024 updated');
}

const iosSplashDir = path.join(rootDir, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset');
if (fs.existsSync(iosSplashDir)) {
  const splashBuf = createPng(1080, 1920, (x, y, w, h) => getSplashPixel(x, y, w, h));
  fs.writeFileSync(path.join(iosSplashDir, 'splash-2732x2732.png'), splashBuf);
  fs.writeFileSync(path.join(iosSplashDir, 'splash-2732x2732-1.png'), splashBuf);
  fs.writeFileSync(path.join(iosSplashDir, 'splash-2732x2732-2.png'), splashBuf);
  console.log('✓ iOS Splash Screen assets updated');
}

console.log('🎉 All mobile platform icons and splash assets deployed successfully!');

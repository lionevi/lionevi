/**
 * Genere les icones PNG du panneau sans dependance graphique.
 *
 * UXP exige de vrais PNG referencés par le manifeste : un fichier manquant fait
 * echouer le chargement du plugin. On encode donc ici des PNG minimaux
 * (RGBA, non compresses par filtre) directement avec `zlib`.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'assets',
  'icons',
);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function png(size, pixel) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // profondeur par canal
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let offset = 0;
  for (let y = 0; y < size; y += 1) {
    raw[offset] = 0; // filtre « none »
    offset += 1;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixel(x, y, size);
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
      offset += 4;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Un « F » stylise dans un carre arrondi : lisible des 23 px. */
function glyph(color) {
  return (x, y, size) => {
    const unit = size / 23;
    const inset = 2 * unit;
    const inside =
      x >= inset && x <= size - inset && y >= inset && y <= size - inset;
    if (!inside) return [0, 0, 0, 0];

    const gx = (x - inset) / (size - 2 * inset);
    const gy = (y - inset) / (size - 2 * inset);
    const stem = gx >= 0.22 && gx <= 0.4;
    const topBar = gy >= 0.12 && gy <= 0.3 && gx >= 0.22 && gx <= 0.82;
    const midBar = gy >= 0.44 && gy <= 0.6 && gx >= 0.22 && gx <= 0.68;
    const onGlyph = stem ? gy >= 0.12 && gy <= 0.88 : topBar || midBar;
    return onGlyph ? [...color, 255] : [0, 0, 0, 0];
  };
}

mkdirSync(OUT_DIR, { recursive: true });

const icons = [
  { file: 'panel-light.png', size: 46, pixel: glyph([44, 44, 44]) },
  { file: 'panel-dark.png', size: 46, pixel: glyph([230, 230, 230]) },
  { file: 'plugin.png', size: 96, pixel: glyph([38, 128, 235]) },
];

for (const icon of icons) {
  writeFileSync(path.join(OUT_DIR, icon.file), png(icon.size, icon.pixel));
  console.log(`icone generee : ${icon.file} (${icon.size}px)`);
}

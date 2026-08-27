/**
 * Assemble `dist/` en archive `.ccx`, le format de distribution des plugins UXP
 * (une archive ZIP dont la racine contient `manifest.json`).
 *
 * L archive est ecrite ici plutot qu avec une dependance tierce : le format ZIP
 * utile se resume a trois structures, et le plugin n a aucune raison d embarquer
 * un paquet supplementaire pour cela.
 */
import { deflateRawSync } from 'node:zlib';
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

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

function walk(dir, base = '') {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const relative = base ? `${base}/${entry}` : entry;
    if (statSync(full).isDirectory()) files.push(...walk(full, relative));
    else files.push({ full, relative });
  }
  return files;
}

function dosDateTime(date) {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function buildZip(entries) {
  const chunks = [];
  const central = [];
  const { time, day } = dosDateTime(new Date());
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.relative, 'utf8');
    const compressed = deflateRawSync(entry.data, { level: 9 });
    const crc = crc32(entry.data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    chunks.push(local, name, compressed);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(8, 10);
    header.writeUInt16LE(time, 12);
    header.writeUInt16LE(day, 14);
    header.writeUInt32LE(crc, 16);
    header.writeUInt32LE(compressed.length, 20);
    header.writeUInt32LE(entry.data.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([header, name]));

    offset += local.length + name.length + compressed.length;
  }

  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...chunks, directory, end]);
}

if (!existsSync(path.join(DIST, 'manifest.json'))) {
  console.error('dist/manifest.json est absent : lancez « npm run build » d abord.');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const entries = walk(DIST)
  // Les sourcemaps n ont rien a faire dans une archive distribuee.
  .filter((file) => !file.relative.endsWith('.map'))
  .map((file) => ({ relative: file.relative, data: readFileSync(file.full) }));

const outFile = path.join(ROOT, `${pkg.name}-${pkg.version}.ccx`);
writeFileSync(outFile, buildZip(entries));
console.log(`archive ecrite : ${path.relative(ROOT, outFile)} (${entries.length} fichiers)`);

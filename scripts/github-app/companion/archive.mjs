// A canonical stored ZIP: small local runtime files need no compression library.
// The reader accepts only bytes this writer can produce, including headers/CRC.
const LIMIT = 2 * 1024 * 1024;
export const COMPANION_DOWNLOAD = 'downloads/zzz-setup-companion.zip';
export const COMPANION_FILES = Object.freeze([
  'adapter.js', 'collect.js', 'manifest.json', 'popup.css', 'popup.html', 'popup.js',
]);

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createCompanionArchive(files) {
  const sorted = [...files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (sorted.length !== COMPANION_FILES.length
    || sorted.some((file, i) => file.path !== COMPANION_FILES[i] || !Buffer.isBuffer(file.bytes))) {
    throw Error('Companion archive must contain exactly the six runtime files.');
  }
  const locals = [], directory = [];
  let offset = 0;
  for (const file of sorted) {
    const name = Buffer.from(file.path);
    const crc = crc32(file.bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(33, 12); // Fixed 1980-01-01; no machine timestamp.
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.bytes.length, 18);
    local.writeUInt32LE(file.bytes.length, 22);
    local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(33, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.bytes.length, 20);
    central.writeUInt32LE(file.bytes.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, file.bytes);
    directory.push(central, name);
    offset += local.length + name.length + file.bytes.length;
  }
  const central = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(sorted.length, 8);
  end.writeUInt16LE(sorted.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  const result = Buffer.concat([...locals, central, end]);
  if (result.length > LIMIT) throw Error('Companion archive exceeds its bounded runtime size.');
  return result;
}

export function readCompanionArchive(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length > LIMIT) throw Error('Invalid companion archive size.');
  const files = [];
  let offset = 0;
  for (let i = 0; i < COMPANION_FILES.length; i++) {
    if (offset + 30 > bytes.length || bytes.readUInt32LE(offset) !== 0x04034b50) throw Error('Invalid ZIP header.');
    const size = bytes.readUInt32LE(offset + 18);
    const nameLength = bytes.readUInt16LE(offset + 26);
    const start = offset + 30 + nameLength;
    const end = start + size;
    if (end > bytes.length) throw Error('Truncated companion archive.');
    files.push({ path: bytes.subarray(offset + 30, start).toString('utf8'), bytes: bytes.subarray(start, end) });
    offset = end;
  }
  if (!createCompanionArchive(files).equals(bytes)) throw Error('Noncanonical or corrupt companion archive.');
  return files;
}

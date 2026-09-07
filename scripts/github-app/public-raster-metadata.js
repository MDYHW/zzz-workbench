import { Buffer } from 'node:buffer'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const RETAINED_PNG_CHUNKS = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'cHRM', 'gAMA', 'sRGB', 'pHYs', 'sBIT', 'bKGD'])
const RETAINED_WEBP_CHUNKS = new Set(['VP8 ', 'VP8L', 'VP8X', 'ALPH', 'ANIM', 'ANMF'])

export class RasterMetadataError extends Error {
  constructor(message) {
    super(message)
    this.name = 'RasterMetadataError'
  }
}

function invalid(message) {
  throw new RasterMetadataError(message)
}

function stripPngMetadata(bytes, artifactPath) {
  if (bytes.length < PNG_SIGNATURE.length || !bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return bytes
  const retained = [bytes.subarray(0, PNG_SIGNATURE.length)]
  let offset = PNG_SIGNATURE.length
  let sawHeader = false
  let sawImage = false
  let sawEnd = false
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset)
    const end = offset + 12 + length
    if (end > bytes.length) invalid(`PNG container is malformed: ${artifactPath}`)
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    if (!/^[A-Za-z]{4}$/.test(type)) invalid(`PNG chunk is malformed: ${artifactPath}`)
    if (type === 'IHDR') sawHeader = offset === PNG_SIGNATURE.length && length === 13
    if (type === 'IDAT') sawImage = true
    if (type === 'IEND') {
      if (length !== 0 || end !== bytes.length) invalid(`PNG end chunk is malformed: ${artifactPath}`)
      sawEnd = true
    }
    if (RETAINED_PNG_CHUNKS.has(type)) retained.push(bytes.subarray(offset, end))
    else if (type[0] === type[0].toUpperCase()) invalid(`Unsupported critical PNG chunk: ${artifactPath}`)
    offset = end
    if (sawEnd) break
  }
  if (!sawHeader || !sawImage || !sawEnd || offset !== bytes.length) invalid(`PNG container is incomplete: ${artifactPath}`)
  return Buffer.concat(retained)
}

function stripWebpMetadata(bytes, artifactPath) {
  if (bytes.length < 12 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') return bytes
  if (bytes.readUInt32LE(4) + 8 !== bytes.length) invalid(`WebP container is malformed: ${artifactPath}`)
  const chunks = []
  let offset = 12
  let sawImage = false
  while (offset + 8 <= bytes.length) {
    const type = bytes.toString('ascii', offset, offset + 4)
    const length = bytes.readUInt32LE(offset + 4)
    const paddedLength = length + (length % 2)
    const end = offset + 8 + paddedLength
    if (end > bytes.length) invalid(`WebP chunk is malformed: ${artifactPath}`)
    if (['VP8 ', 'VP8L', 'ANMF'].includes(type)) sawImage = true
    if (RETAINED_WEBP_CHUNKS.has(type)) {
      const chunk = Buffer.from(bytes.subarray(offset, end))
      if (type === 'VP8X') {
        if (length !== 10) invalid(`WebP extended header is malformed: ${artifactPath}`)
        chunk[8] &= ~0x2c
      }
      chunks.push(chunk)
    }
    offset = end
  }
  if (!sawImage || offset !== bytes.length) invalid(`WebP container is incomplete: ${artifactPath}`)
  const payload = Buffer.concat([Buffer.from('WEBP'), ...chunks])
  const header = Buffer.alloc(8)
  header.write('RIFF', 0, 'ascii')
  header.writeUInt32LE(payload.length, 4)
  return Buffer.concat([header, payload])
}

export function sanitizeRasterMetadata(artifactPath, source) {
  const bytes = Buffer.isBuffer(source) ? source : Buffer.from(source)
  if (artifactPath.endsWith('.png')) return stripPngMetadata(bytes, artifactPath)
  if (artifactPath.endsWith('.webp')) return stripWebpMetadata(bytes, artifactPath)
  return bytes
}

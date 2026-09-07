import type { Buffer } from 'node:buffer'

export class RasterMetadataError extends Error {}

export function sanitizeRasterMetadata(
  artifactPath: string,
  source: string | Uint8Array,
): Buffer

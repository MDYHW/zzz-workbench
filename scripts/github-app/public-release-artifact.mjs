import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sanitizeRasterMetadata } from './public-raster-metadata.js';

export const ARTIFACT_SCHEMA = 'zzz-workbench-public-artifact/v1';
export const ARTIFACT_CANDIDATE_SCHEMA = 'zzz-workbench-public-release-candidate/v1';
export const RELEASE_DECISION_SCHEMA = 'zzz-workbench-public-release-decision/v1';
export const DIGEST_ALGORITHM = 'sha256';
export const REGULAR_FILE_MODE = '100644';
export const WORLDWIDE_DELIVERY = Object.freeze({
  provider: 'github-pages',
  reach: 'worldwide-unrestricted',
  jurisdictions: Object.freeze(['worldwide']),
});
export const REQUIRED_CSP = "default-src 'none'; base-uri 'none'; connect-src 'self'; font-src 'self'; form-action 'none'; frame-src 'none'; img-src 'self' data:; manifest-src 'self'; media-src 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'none'";
export const REQUIRED_FOOTER_WORDING = Object.freeze([
  'This is an unofficial, non-commercial fan-made website. It is not sponsored, endorsed, or approved by HoYoverse. © All rights reserved by miHoYo. Other properties and any right, title, and interest thereof and therein (intellectual property rights included) not derived from Zenless Zone Zero belong to their respective owners.',
  '이 프로젝트는 비공식·비상업적 팬메이드 웹사이트이며 HoYoverse의 후원·보증·승인을 받지 않았습니다. Zenless Zone Zero 관련 이미지와 에셋의 권리는 HoYoverse 및 관련 권리자에게 귀속되며, 그 밖의 자산과 권리는 각 소유자에게 귀속됩니다.',
]);
export const REQUIRED_FOOTER_DIGEST = framedDigestIdentity(
  'zzz-workbench-public-footer/v1',
  REQUIRED_FOOTER_WORDING,
);
export const TRUSTED_CONTROLLER_ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

const SHA1 = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const SHA256_IDENTITY = /^sha256:[0-9a-f]{64}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const HASHED_ASSET = /^assets\/[A-Za-z0-9][A-Za-z0-9._-]*-[A-Za-z0-9_-]{6,}\.(?:css|js|png|webp)$/;
const TEXT_OUTPUT = /\.(?:css|html|js)$/;
const EXTERNAL_TARGET = /https?:\/\/[A-Za-z0-9][A-Za-z0-9._~:/?#[\]@!$&'*+,;=%-]*|\/\/[A-Za-z0-9](?:[A-Za-z0-9-]*\.)+[A-Za-z]{2,63}(?:[/:?#][A-Za-z0-9._~:/?#[\]@!$&'*+,;=%-]*)?/g;
const CREDENTIAL_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
];
const ABSOLUTE_LOCAL_PATHS = [
  /(?:^|[^A-Za-z0-9])[A-Za-z]:[\\/][^\r\n\0<>|]+/i,
  /(?:^|[\s"'`=(])\\\\[A-Za-z0-9][A-Za-z0-9._-]*\\[A-Za-z0-9][A-Za-z0-9._-]*/,
  /\bfile:\/{2,3}[^\s"'`<>]+/i,
  /(?:^|[\s"'`=(])\/(?!assets(?:\/|["'`]))(?:[A-Za-z0-9._-]+\/)+[A-Za-z0-9._-]+/,
];
const SHORT_BINARY_ABSOLUTE_LOCAL_PATHS = [
  /(?:^|[^A-Za-z0-9])[A-Za-z]:[\\/][A-Za-z0-9._-]+[\\/][A-Za-z0-9._-]+/i,
  /(?:^|[\s"'`=(])\\\\[A-Za-z0-9][A-Za-z0-9._-]*\\[A-Za-z0-9][A-Za-z0-9._-]*/,
  /\bfile:\/{2,3}[^\s"'`<>]+/i,
  /(?:^|[\s"'`=(])\/(?:[a-z][a-z0-9._-]{2,}\/)+[A-Za-z0-9._-]+/,
];
const FORBIDDEN_BUILD_PATHS = /(^|\/)(?:\.git|\.npmrc|dist|node_modules)(?:\/|$)/;
const INERT_REASON = 'non-requesting-diagnostic';
const MAX_COMMAND_OUTPUT_BYTES = 128 * 1024 * 1024;
const RUNTIME_API_PATTERNS = Object.freeze({
  'document.cookie': /\bdocument\s*\.\s*cookie\b/g,
  localStorage: /\b(?:window\s*\.\s*)?localStorage\b/g,
  sessionStorage: /\b(?:window\s*\.\s*)?sessionStorage\b/g,
  indexedDB: /\b(?:window\s*\.\s*)?indexedDB\b/g,
  serviceWorker: /\b(?:navigator\s*\.\s*)?serviceWorker\b/g,
  'Cache Storage': /\b(?:window\s*\.\s*)?caches\s*\.\s*(?:delete|has|keys|match|open)\s*\(/g,
  sendBeacon: /\b(?:navigator\s*\.\s*)?sendBeacon\s*\(/g,
  XMLHttpRequest: /\bXMLHttpRequest\b/g,
  WebSocket: /\bWebSocket\b/g,
  EventSource: /\bEventSource\b/g,
  fetch: /\bfetch\s*\(/g,
});

export class ArtifactValidationError extends Error {
  constructor(message, code = 'artifact_invalid') {
    super(message);
    this.name = 'ArtifactValidationError';
    this.code = code;
  }
}

function fail(message, code) {
  throw new ArtifactValidationError(message, code);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function requireExactKeys(value, expected, label) {
  if (!isPlainObject(value)) fail(`${label} must be an object.`, 'schema_invalid');
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} has an unsupported schema.`, 'schema_invalid');
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail(`${label} is required.`, 'schema_invalid');
  return value;
}

function requireSha(value, pattern, label) {
  if (typeof value !== 'string' || !pattern.test(value)) fail(`${label} is invalid.`, 'schema_invalid');
  return value;
}

function canonicalJson(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return JSON.stringify(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (!isPlainObject(value)) fail('Only JSON values can be bound to a release decision.', 'schema_invalid');
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

function jsonEquals(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function normalizeForbiddenFragments(values, { rejectDuplicates = true } = {}) {
  if (!Array.isArray(values) || values.length === 0) {
    fail('At least one private identifier is required.', 'schema_invalid');
  }
  const normalized = values.map((value) => {
    if (typeof value !== 'string' || value.length === 0 || value !== value.trim()
        || value !== value.normalize('NFC') || /[\r\n\0]/.test(value)) {
      fail('Forbidden fragments must be canonical non-empty strings.', 'schema_invalid');
    }
    return value.toLowerCase().normalize('NFC');
  });
  const unique = new Set(normalized);
  if (rejectDuplicates && unique.size !== normalized.length) {
    fail('Forbidden fragments must be case-insensitively unique.', 'schema_invalid');
  }
  return [...unique].sort(compareCanonicalPath);
}

function compareCanonicalPath(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function gitBlobSha(bytes) {
  return createHash('sha1')
    .update(Buffer.from(`blob ${bytes.length}\0`, 'utf8'))
    .update(bytes)
    .digest('hex');
}

function framedDigest(domain, fields) {
  const hash = createHash('sha256');
  for (const field of [domain, ...fields]) {
    const bytes = Buffer.isBuffer(field) ? field : Buffer.from(String(field), 'utf8');
    const length = Buffer.alloc(8);
    length.writeBigUInt64BE(BigInt(bytes.length));
    hash.update(length);
    hash.update(bytes);
  }
  return hash.digest('hex');
}

function framedDigestIdentity(domain, fields) {
  return `sha256:${framedDigest(domain, fields)}`;
}

export function normalizeArtifactPath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\\') || value.includes('\0')) {
    fail('Artifact path is not canonical.', 'path_invalid');
  }
  if (value !== value.normalize('NFC') || value.startsWith('/') || /^[A-Za-z]:/.test(value)
      || value.includes('//') || value.split('/').some((part) => part === '' || part === '.' || part === '..')
      || !/^[\x21-\x7e]+$/.test(value)) {
    fail(`Artifact path is not canonical: ${value}`, 'path_invalid');
  }
  return value;
}

function validateAllowedPath(artifactPath) {
  if (artifactPath === 'index.html' || artifactPath === '.nojekyll' || HASHED_ASSET.test(artifactPath)) return;
  fail(`Artifact path is not allowlisted: ${artifactPath}`, 'path_not_allowlisted');
}

function countOccurrences(haystack, needle) {
  let count = 0;
  let index = 0;
  while ((index = haystack.indexOf(needle, index)) >= 0) {
    count += 1;
    index += needle.length;
  }
  return count;
}

function validateException(exception) {
  requireExactKeys(exception, ['path', 'url', 'occurrences', 'reason'], 'Inert external URL exception');
  const artifactPath = normalizeArtifactPath(exception.path);
  if (!TEXT_OUTPUT.test(artifactPath)) fail('Inert URL exception must name a text output.', 'exception_invalid');
  if (typeof exception.url !== 'string' || !/^https?:\/\//.test(exception.url)) {
    fail('Inert URL exception must name one exact HTTP(S) URL.', 'exception_invalid');
  }
  if (!Number.isSafeInteger(exception.occurrences) || exception.occurrences < 1 || exception.reason !== INERT_REASON) {
    fail('Inert URL exception is invalid.', 'exception_invalid');
  }
  return { ...exception, path: artifactPath };
}

function validateRuntimeException(exception) {
  requireExactKeys(exception, ['api', 'occurrences', 'path', 'reason'], 'Inert runtime API exception');
  const artifactPath = normalizeArtifactPath(exception.path);
  if (!/\.(?:html|js)$/.test(artifactPath) || !Object.hasOwn(RUNTIME_API_PATTERNS, exception.api)
      || !Number.isSafeInteger(exception.occurrences) || exception.occurrences < 1 || exception.reason !== INERT_REASON) {
    fail('Inert runtime API exception is invalid.', 'exception_invalid');
  }
  return { ...exception, path: artifactPath };
}

function parseTagAttributes(tag, expectedName) {
  const opening = new RegExp(`^<${expectedName}\\b([\\s\\S]*?)\\/?>$`, 'i').exec(tag);
  if (!opening) fail('Document metadata tag is malformed.', 'csp_invalid');
  const attributes = new Map();
  let rest = opening[1];
  while (rest.trim().length > 0) {
    rest = rest.trimStart();
    const attribute = /^([A-Za-z_:][A-Za-z0-9:._-]*)\s*=\s*(["'])([\s\S]*?)\2/.exec(rest);
    if (!attribute) fail('Document metadata attributes are malformed.', 'csp_invalid');
    const name = attribute[1].toLowerCase();
    if (attributes.has(name)) fail('Document metadata attributes must be unique.', 'csp_invalid');
    attributes.set(name, attribute[3]);
    rest = rest.slice(attribute[0].length);
  }
  return attributes;
}

function extractCsp(html) {
  const uncommented = html.replace(/<!--[\s\S]*?-->/g, '');
  const headMatch = /^\s*<!doctype\s+html\s*>\s*<html\b[^>]*>\s*<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(uncommented);
  if (!headMatch) fail('The generated document must contain one effective head.', 'csp_invalid');
  const head = headMatch[1];
  const policies = [];
  let loadingSeen = false;
  const token = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g;
  for (let match; (match = token.exec(head));) {
    const tag = match[0];
    if (tag.startsWith('<!--') || /^<\//.test(tag)) continue;
    const name = /^<([A-Za-z][A-Za-z0-9:-]*)/.exec(tag)?.[1].toLowerCase();
    const metaAttributes = name === 'meta' ? parseTagAttributes(tag, 'meta') : null;
    const cspMeta = metaAttributes?.get('http-equiv')?.toLowerCase() === 'content-security-policy';
    if (policies.length === 0 && !cspMeta) {
      const safeCharset = metaAttributes?.size === 1 && metaAttributes.get('charset')?.toLowerCase() === 'utf-8';
      if (!safeCharset) fail('Only the exact UTF-8 charset meta may precede Content Security Policy.', 'csp_invalid');
      continue;
    }
    if (name === 'template' || name === 'script' || name === 'style') {
      if (name !== 'template') loadingSeen = true;
      const close = new RegExp(`<\\/${name}\\s*>`, 'ig');
      close.lastIndex = token.lastIndex;
      const end = close.exec(head);
      if (end) token.lastIndex = close.lastIndex;
      continue;
    }
    if (['link', 'img', 'iframe', 'audio', 'video', 'source', 'object', 'embed'].includes(name)) loadingSeen = true;
    if (name !== 'meta') continue;
    if (!cspMeta && metaAttributes.has('http-equiv')) {
      fail('Non-CSP http-equiv metadata is forbidden.', 'csp_invalid');
    }
    if (!cspMeta) continue;
    if (metaAttributes.size !== 2 || !metaAttributes.has('content')) {
      fail('Content Security Policy meta is malformed.', 'csp_invalid');
    }
    if (loadingSeen) fail('Content Security Policy must precede every active resource element.', 'csp_invalid');
    policies.push(metaAttributes.get('content').trim().replace(/\s+/g, ' '));
  }
  if (policies.length !== 1 || policies[0] !== REQUIRED_CSP) {
    fail('The generated document must contain exactly the required Content Security Policy.', 'csp_invalid');
  }
  return policies[0];
}

export function deriveFooterDigest(files) {
  if (!Array.isArray(files) || files.length === 0) fail('Footer artifact tree is empty.', 'footer_invalid');
  const text = files.filter((file) => {
    if (!isPlainObject(file) || typeof file.path !== 'string' || !Buffer.isBuffer(file.bytes)) {
      fail('Footer artifact input is invalid.', 'footer_invalid');
    }
    return TEXT_OUTPUT.test(file.path);
  }).map((file) => {
    const value = file.bytes.toString('utf8');
    if (value.includes('\ufffd')) fail('Footer text output is not valid UTF-8.', 'footer_invalid');
    return value;
  }).join('\n');
  if (REQUIRED_FOOTER_WORDING.some((wording) => countOccurrences(text, wording) !== 1)) {
    fail('The generated artifact must contain one exact bilingual legal footer.', 'footer_invalid');
  }
  return REQUIRED_FOOTER_DIGEST;
}

function binaryMetadataRuns(bytes) {
  return binaryPrintableRuns(bytes, { minimumCharacters: 8, minimumBytes: 16 });
}

function binaryPrintableRuns(bytes, { minimumCharacters, minimumBytes }) {
  const runs = [];
  const retain = (value) => {
    if (value.length >= minimumCharacters && Buffer.byteLength(value, 'utf8') >= minimumBytes) runs.push(value);
  };
  const ascii = bytes.toString('latin1').match(/[\x20-\x7e]+/g) ?? [];
  ascii.forEach(retain);
  const utf8 = bytes.toString('utf8').match(/[^\u0000-\u001f\u007f-\u009f\ufffd]+/gu) ?? [];
  utf8.forEach(retain);
  for (const littleEndian of [true, false]) {
    for (const offset of [0, 1]) {
      let value = '';
      const flush = () => {
        retain(value);
        value = '';
      };
      for (let index = offset; index + 1 < bytes.length; index += 2) {
        const code = littleEndian ? bytes.readUInt16LE(index) : bytes.readUInt16BE(index);
        if ((code >= 0x20 && code <= 0x7e) || code >= 0xa0) value += String.fromCharCode(code);
        else flush();
      }
      flush();
    }
  }
  return [...new Set(runs)];
}

function binaryIdentityViews(bytes) {
  const views = [bytes.toString('latin1'), bytes.toString('utf8')];
  for (const littleEndian of [true, false]) {
    for (const offset of [0, 1]) {
      let value = '';
      for (let index = offset; index + 1 < bytes.length; index += 2) {
        const code = littleEndian ? bytes.readUInt16LE(index) : bytes.readUInt16BE(index);
        value += String.fromCharCode(code);
      }
      views.push(value);
    }
  }
  return views;
}

function stripRasterMetadata(artifactPath, bytes) {
  try {
    return sanitizeRasterMetadata(artifactPath, bytes);
  } catch {
    fail(`Raster container is invalid: ${artifactPath}`, 'content_invalid');
  }
}

function validateArtifactPathContent(artifactPath, forbiddenFragments) {
  const lowerPath = artifactPath.normalize('NFC').toLowerCase().normalize('NFC');
  for (const fragment of forbiddenFragments) {
    if (lowerPath.includes(fragment)) fail(`Private identifier is forbidden in artifact path: ${artifactPath}`, 'content_forbidden');
  }
  for (const pattern of CREDENTIAL_PATTERNS) {
    if (pattern.test(artifactPath)) fail(`Credential-like artifact path is forbidden: ${artifactPath}`, 'content_forbidden');
  }
}

function validateFileContent(
  file,
  options,
  exceptionsByPath,
  exceptionInventory,
  runtimeExceptionsByPath,
  runtimeExceptionInventory,
) {
  const textOutput = TEXT_OUTPUT.test(file.path);
  const scanTexts = textOutput ? [file.bytes.toString('utf8')] : binaryMetadataRuns(file.bytes);
  const identityTexts = textOutput ? scanTexts : binaryIdentityViews(file.bytes);
  const scanText = scanTexts.join('\0');
  if (textOutput && scanText.includes('\ufffd')) fail(`Text output is not valid UTF-8: ${file.path}`, 'content_invalid');
  if (textOutput && /data:image\/(?:png|webp)(?:;|,)/i.test(scanText)) {
    fail(`Inline raster data is forbidden: ${file.path}`, 'content_forbidden');
  }
  if (file.path === 'index.html' && /&(?:#[xX][0-9A-Fa-f]+|#[0-9]+|[A-Za-z][A-Za-z0-9]+);?/.test(scanText)) {
    fail('HTML character references are forbidden in the generated document.', 'content_forbidden');
  }
  if (/sourceMappingURL\s*=/.test(scanText)) fail(`Source-map reference is forbidden: ${file.path}`, 'content_forbidden');
  for (const pattern of CREDENTIAL_PATTERNS) {
    if (pattern.test(scanText)) fail(`Credential-like content is forbidden: ${file.path}`, 'content_forbidden');
  }
  // Binary assets can contain short path-shaped byte runs by chance. Retain
  // metadata-path detection only for substantial printable runs; text outputs
  // continue to receive the complete absolute-path scan.
  const pathScans = textOutput
    ? [{ texts: [scanText], patterns: ABSOLUTE_LOCAL_PATHS }]
    : [
        { texts: scanTexts, patterns: ABSOLUTE_LOCAL_PATHS },
        {
          texts: binaryPrintableRuns(file.bytes, { minimumCharacters: 4, minimumBytes: 4 }),
          patterns: SHORT_BINARY_ABSOLUTE_LOCAL_PATHS,
        },
      ];
  for (const { texts, patterns } of pathScans) {
    for (const pathScanText of texts) for (const pattern of patterns) {
      if (pattern.test(pathScanText)) fail(`Absolute local path is forbidden: ${file.path}`, 'content_forbidden');
    }
  }
  for (const candidateText of identityTexts) {
    const lowerText = candidateText.normalize('NFC').toLowerCase().normalize('NFC');
    for (const fragment of options.forbiddenFragments) {
      if (lowerText.includes(fragment)) fail(`Private identifier is forbidden: ${file.path}`, 'content_forbidden');
    }
  }

  if (!textOutput) {
    return;
  }
  const text = scanText;
  const externalTargets = [...text.matchAll(EXTERNAL_TARGET)];

  if (/\.(?:html|js)$/.test(file.path)) {
    const allowedRuntimeApis = runtimeExceptionsByPath.get(file.path) ?? new Map();
    for (const [api, pattern] of Object.entries(RUNTIME_API_PATTERNS)) {
      const actual = [...text.matchAll(pattern)].length;
      const exception = allowedRuntimeApis.get(api);
      if (actual > 0 && !exception) fail(`Forbidden runtime API ${api} appears in ${file.path}.`, 'runtime_api_forbidden');
      if (exception && actual !== exception.occurrences) {
        fail(`Inert runtime API inventory does not match ${file.path}.`, 'exception_mismatch');
      }
      if (exception) runtimeExceptionInventory.push({ ...exception, observedOccurrences: actual });
    }
  }

  const allowed = exceptionsByPath.get(file.path) ?? new Map();
  const found = new Map();
  for (const match of externalTargets) {
    const url = match[0];
    if (!allowed.has(url)) fail(`External target is forbidden in ${file.path}.`, 'external_target');
    found.set(url, (found.get(url) ?? 0) + 1);
  }
  for (const [url, exception] of allowed) {
    const actual = found.get(url) ?? 0;
    if (actual !== exception.occurrences || countOccurrences(text, url) !== exception.occurrences) {
      fail(`Inert URL inventory does not match ${file.path}.`, 'exception_mismatch');
    }
    exceptionInventory.push({ ...exception, observedOccurrences: actual });
  }
}

function validateFileRecord(file) {
  requireExactKeys(file, ['path', 'mode', 'bytes'], 'Artifact file');
  const artifactPath = normalizeArtifactPath(file.path);
  validateAllowedPath(artifactPath);
  if (file.mode !== REGULAR_FILE_MODE || !Buffer.isBuffer(file.bytes)) {
    fail(`Artifact entry is not a regular file: ${artifactPath}`, 'type_invalid');
  }
  return { path: artifactPath, mode: file.mode, bytes: file.bytes };
}

export function createArtifactManifest(files, {
  forbiddenFragments = [], inertExternalUrlExceptions = [], inertRuntimeApiExceptions = [],
} = {}) {
  if (!Array.isArray(files) || files.length === 0) fail('Artifact tree is empty.');
  const canonicalForbiddenFragments = normalizeForbiddenFragments(forbiddenFragments);
  if (!Array.isArray(inertExternalUrlExceptions)) fail('External URL exceptions must be an array.', 'schema_invalid');
  const exceptions = inertExternalUrlExceptions.map(validateException);
  if (!Array.isArray(inertRuntimeApiExceptions)) fail('Runtime API exceptions must be an array.', 'schema_invalid');
  const runtimeExceptions = inertRuntimeApiExceptions.map(validateRuntimeException);
  const exceptionsByPath = new Map();
  for (const exception of exceptions) {
    const byUrl = exceptionsByPath.get(exception.path) ?? new Map();
    if (byUrl.has(exception.url)) fail('Inert URL exception is duplicated.', 'exception_invalid');
    byUrl.set(exception.url, exception);
    exceptionsByPath.set(exception.path, byUrl);
  }

  const runtimeExceptionsByPath = new Map();
  for (const exception of runtimeExceptions) {
    const byApi = runtimeExceptionsByPath.get(exception.path) ?? new Map();
    if (byApi.has(exception.api)) fail('Inert runtime API exception is duplicated.', 'exception_invalid');
    byApi.set(exception.api, exception);
    runtimeExceptionsByPath.set(exception.path, byApi);
  }

  const admitted = files.map(validateFileRecord).sort((left, right) => compareCanonicalPath(left.path, right.path));
  const pathIdentities = new Set();
  const paths = new Set();
  const exceptionInventory = [];
  const runtimeExceptionInventory = [];
  for (const file of admitted) {
    if (paths.has(file.path) || pathIdentities.has(file.path.toLowerCase())) {
      fail(`Artifact path collides with another entry: ${file.path}`, 'path_collision');
    }
    paths.add(file.path);
    pathIdentities.add(file.path.toLowerCase());
    validateArtifactPathContent(file.path, canonicalForbiddenFragments);
    if (!stripRasterMetadata(file.path, file.bytes).equals(file.bytes)) {
      fail(`Raster metadata is forbidden: ${file.path}`, 'content_forbidden');
    }
    validateFileContent(
      file,
      { forbiddenFragments: canonicalForbiddenFragments },
      exceptionsByPath,
      exceptionInventory,
      runtimeExceptionsByPath,
      runtimeExceptionInventory,
    );
  }
  if (!paths.has('index.html') || !paths.has('.nojekyll') || admitted.find((file) => file.path === '.nojekyll').bytes.length !== 0) {
    fail('Artifact requires index.html and an empty .nojekyll file.', 'tree_incomplete');
  }
  for (const exception of exceptions) {
    if (!exceptionInventory.some((entry) => entry.path === exception.path && entry.url === exception.url)) {
      fail('Inert URL exception does not match an admitted file.', 'exception_mismatch');
    }
  }
  for (const exception of runtimeExceptions) {
    if (!runtimeExceptionInventory.some((entry) => entry.path === exception.path && entry.api === exception.api)) {
      fail('Inert runtime API exception does not match an admitted file.', 'exception_mismatch');
    }
  }
  const index = admitted.find((file) => file.path === 'index.html');
  extractCsp(index.bytes.toString('utf8'));

  const entries = admitted.map((file) => ({
    path: file.path,
    mode: file.mode,
    size: file.bytes.length,
    sha256: sha256(file.bytes),
  }));
  const manifestBody = { schema: ARTIFACT_SCHEMA, digestAlgorithm: DIGEST_ALGORITHM, entries };
  const manifestDigest = framedDigestIdentity(`${ARTIFACT_SCHEMA}:manifest`, [canonicalJson(manifestBody)]);
  const treeFields = entries.flatMap((entry) => [entry.path, entry.mode, String(entry.size), entry.sha256]);
  const treeDigest = framedDigestIdentity(`${ARTIFACT_SCHEMA}:tree`, treeFields);
  return {
    ...manifestBody,
    manifestDigest,
    treeDigest,
    inertExternalUrlInventory: exceptionInventory.sort((left, right) => compareCanonicalPath(left.path, right.path) || compareCanonicalPath(left.url, right.url)),
    inertRuntimeApiInventory: runtimeExceptionInventory.sort((left, right) => compareCanonicalPath(left.path, right.path) || compareCanonicalPath(left.api, right.api)),
  };
}

export async function readArtifactTree(root, { fsImpl = fs } = {}) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) fail('Artifact root must be absolute.', 'path_invalid');
  const resolvedRoot = path.resolve(root);
  let rootStat;
  try {
    rootStat = await fsImpl.lstat(resolvedRoot);
  } catch {
    fail('Artifact root must exist.', 'path_invalid');
  }
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    fail('Artifact root must be a real directory.', 'type_invalid');
  }
  const realRoot = await fsImpl.realpath(resolvedRoot);
  if (!pathsEqual(realRoot, resolvedRoot)) {
    fail('Artifact root must not redirect elsewhere.', 'type_invalid');
  }
  const files = [];
  async function walk(directory, prefix = '') {
    const entries = await fsImpl.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      normalizeArtifactPath(relative);
      const absolute = path.join(directory, entry.name);
      const stat = await fsImpl.lstat(absolute);
      if (stat.isSymbolicLink()) fail(`Symlink is forbidden: ${relative}`, 'type_invalid');
      if (stat.isDirectory()) await walk(absolute, relative);
      else if (stat.isFile()) files.push({ path: relative, mode: REGULAR_FILE_MODE, bytes: await fsImpl.readFile(absolute) });
      else fail(`Unexpected artifact entry type: ${relative}`, 'type_invalid');
    }
  }
  await walk(resolvedRoot);
  return files;
}

function pathIsInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function pathsEqual(left, right) {
  const leftPath = path.resolve(left);
  const rightPath = path.resolve(right);
  return process.platform === 'win32'
    ? leftPath.toLowerCase() === rightPath.toLowerCase()
    : leftPath === rightPath;
}

function validateCommandEnvironment(environment) {
  if (!environment || typeof environment !== 'object' || Array.isArray(environment)) {
    fail('Direct command environment is required.', 'command_invalid');
  }
  const result = Object.create(null);
  const identities = new Set();
  for (const [key, value] of Object.entries(environment)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || typeof value !== 'string' || /[\0\r\n]/.test(value)) {
      fail('Direct command environment is invalid.', 'command_invalid');
    }
    const identity = process.platform === 'win32' ? key.toLowerCase() : key;
    if (identities.has(identity)) fail('Direct command environment is ambiguous.', 'command_invalid');
    identities.add(identity);
    result[key] = value;
  }
  return result;
}

function windowsRuntimeValue(environment, name) {
  if (!environment || typeof environment !== 'object' || Array.isArray(environment)) {
    fail('Windows runtime environment is required.', 'command_invalid');
  }
  const matches = Object.entries(environment).filter(([key]) => key.toLowerCase() === name.toLowerCase());
  if (matches.length !== 1) fail(`Windows runtime ${name} is missing or ambiguous.`, 'command_invalid');
  const value = matches[0][1];
  if (typeof value !== 'string' || /[\0\r\n]/.test(value) || !path.win32.isAbsolute(value)) {
    fail(`Windows runtime ${name} is invalid.`, 'command_invalid');
  }
  return path.win32.normalize(value);
}

function createWindowsRuntimeEnvironment(environment = process.env) {
  const systemRoot = windowsRuntimeValue(environment, 'SystemRoot');
  const windir = windowsRuntimeValue(environment, 'WINDIR');
  const comSpec = windowsRuntimeValue(environment, 'ComSpec');
  const equalPath = (left, right) => left.toLowerCase() === right.toLowerCase();
  if (!equalPath(systemRoot, windir)) fail('Windows runtime roots do not match.', 'command_invalid');
  const expectedComSpec = path.win32.join(systemRoot, 'System32', 'cmd.exe');
  if (!equalPath(comSpec, expectedComSpec)) fail('Windows command shell does not match SystemRoot.', 'command_invalid');
  return {
    SystemRoot: systemRoot,
    WINDIR: systemRoot,
    ComSpec: expectedComSpec,
    PATHEXT: '.COM;.EXE;.BAT;.CMD',
  };
}

export function createGitCommandEnvironment(gitExecutable, {
  platform = process.platform,
  runtimeEnvironment = process.env,
} = {}) {
  const runtimePath = platform === 'win32' ? path.win32 : path;
  const git = runtimePath.resolve(gitExecutable);
  return {
    ...(platform === 'win32' ? createWindowsRuntimeEnvironment(runtimeEnvironment) : {}),
    PATH: platform === 'win32' ? runtimePath.dirname(git) : `${runtimePath.dirname(git)}:/usr/bin:/bin`,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: platform === 'win32' ? 'NUL' : '/dev/null',
    GIT_NO_REPLACE_OBJECTS: '1',
    GIT_TERMINAL_PROMPT: '0',
    GCM_INTERACTIVE: 'Never',
    GIT_OPTIONAL_LOCKS: '0',
    LC_ALL: 'C',
  };
}

export function createNpmCommandEnvironment(nodeExecutable, cwd, {
  platform = process.platform,
  runtimeEnvironment = process.env,
} = {}) {
  const runtimePath = platform === 'win32' ? path.win32 : path;
  const node = runtimePath.resolve(nodeExecutable);
  const root = runtimePath.resolve(cwd);
  const windowsRuntime = platform === 'win32' ? createWindowsRuntimeEnvironment(runtimeEnvironment) : {};
  const shell = platform === 'win32' ? windowsRuntime.ComSpec : '/bin/sh';
  return {
    ...windowsRuntime,
    PATH: platform === 'win32' ? runtimePath.dirname(node) : `${runtimePath.dirname(node)}:/usr/bin:/bin`,
    CI: 'true',
    LANG: 'C',
    LC_ALL: 'C',
    TEMP: root,
    TMP: root,
    NPM_CONFIG_AUDIT: 'false',
    NPM_CONFIG_CACHE: runtimePath.join(root, '.npm-cache'),
    NPM_CONFIG_FUND: 'false',
    NPM_CONFIG_GLOBALCONFIG: platform === 'win32' ? 'NUL' : '/dev/null',
    NPM_CONFIG_IGNORE_SCRIPTS: 'true',
    NPM_CONFIG_REGISTRY: 'https://registry.npmjs.org/',
    NPM_CONFIG_SCRIPT_SHELL: shell,
    NPM_CONFIG_UPDATE_NOTIFIER: 'false',
    NPM_CONFIG_USERCONFIG: platform === 'win32' ? 'NUL' : '/dev/null',
  };
}

export async function runDirectCommand({ executable, args, cwd, input = null, env, shell = false }) {
  if (typeof executable !== 'string' || !path.isAbsolute(executable) || !Array.isArray(args)
      || args.some((argument) => typeof argument !== 'string') || typeof cwd !== 'string' || !path.isAbsolute(cwd)
      || shell !== false) {
    fail('Direct command invocation is invalid.', 'command_invalid');
  }
  const commandEnvironment = validateCommandEnvironment(env);
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      shell: false,
      env: commandEnvironment,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    let outputBytes = 0;
    let settled = false;
    const stop = (error) => {
      if (settled) return;
      settled = true;
      child.kill();
      reject(error);
    };
    const capture = (target) => (chunk) => {
      outputBytes += chunk.length;
      if (outputBytes > MAX_COMMAND_OUTPUT_BYTES) {
        stop(new ArtifactValidationError('Direct command output exceeded the release bound.', 'command_failed'));
        return;
      }
      target.push(chunk);
    };
    child.stdout.on('data', capture(stdout));
    child.stderr.on('data', capture(stderr));
    child.once('error', () => stop(new ArtifactValidationError('Git command could not start.', 'command_failed')));
    child.once('close', (code, signal) => {
      if (settled) return;
      settled = true;
      if (code !== 0 || signal) {
        reject(new ArtifactValidationError('Git command failed.', 'command_failed'));
        return;
      }
      resolve({ stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) });
    });
    if (input === null) child.stdin.end();
    else child.stdin.end(input);
  });
}

function validateGitExecutable(gitExecutable) {
  if (typeof gitExecutable !== 'string' || !path.isAbsolute(gitExecutable)
      || !['git', 'git.exe'].includes(path.basename(gitExecutable).toLowerCase())) {
    fail('Git executable must be an absolute allowlisted path.', 'build_input_invalid');
  }
  return path.resolve(gitExecutable);
}

function commandText(result, label) {
  if (!result || !Buffer.isBuffer(result.stdout)) fail(`${label} did not return bytes.`, 'command_failed');
  const value = result.stdout.toString('utf8').replace(/\r?\n$/, '');
  if (value.includes('\0') || value.includes('\r') || value.includes('\n')) fail(`${label} returned an ambiguous value.`, 'command_failed');
  return value;
}

function parseGitTree(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.at(-1) !== 0) {
    fail('Verified Git tree enumeration is malformed.', 'git_tree_invalid');
  }
  const entries = [];
  const paths = new Set();
  const pathIdentities = new Set();
  for (const raw of bytes.subarray(0, -1).toString('utf8').split('\0')) {
    const match = /^(\d{6}) ([a-z]+) ([0-9a-f]{40})\t(.+)$/.exec(raw);
    if (!match) fail('Verified Git tree enumeration is malformed.', 'git_tree_invalid');
    const [, mode, type, objectSha, rawPath] = match;
    const sourcePath = normalizeArtifactPath(rawPath);
    if (paths.has(sourcePath) || pathIdentities.has(sourcePath.toLowerCase())) {
      fail('Verified Git tree contains ambiguous paths.', 'git_tree_invalid');
    }
    paths.add(sourcePath);
    pathIdentities.add(sourcePath.toLowerCase());
    if (type !== 'blob' || !['100644', '100755'].includes(mode)) {
      fail(`Verified Git tree contains a symlink, submodule, or unsupported entry: ${sourcePath}`, 'git_tree_invalid');
    }
    entries.push({ path: sourcePath, mode, objectSha });
  }
  return entries.sort((left, right) => compareCanonicalPath(left.path, right.path));
}

async function verifyFreshExtractionRoot(extractionRoot, repositoryRoot, fsImpl) {
  if (typeof extractionRoot !== 'string' || !path.isAbsolute(extractionRoot)
      || path.resolve(extractionRoot) === path.parse(path.resolve(extractionRoot)).root
      || pathIsInside(repositoryRoot, extractionRoot)) {
    fail('Extraction root must be a fresh external directory.', 'build_input_invalid');
  }
  let stat;
  try {
    stat = await fsImpl.lstat(extractionRoot);
  } catch {
    fail('Extraction root must already exist.', 'build_input_invalid');
  }
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail('Extraction root must be a real directory.', 'build_input_invalid');
  const [realRoot, children] = await Promise.all([fsImpl.realpath(extractionRoot), fsImpl.readdir(extractionRoot)]);
  if (!pathsEqual(realRoot, extractionRoot) || children.length !== 0) {
    fail('Extraction root must be empty and must not redirect elsewhere.', 'build_input_invalid');
  }
  return path.resolve(realRoot);
}

async function verifyExtractedEntries(extractionRoot, sourceEntries, fsImpl) {
  const foundPaths = [];
  async function walk(directory, prefix = '') {
    const children = await fsImpl.readdir(directory, { withFileTypes: true });
    for (const child of children) {
      const relative = normalizeArtifactPath(prefix ? `${prefix}/${child.name}` : child.name);
      const absolute = path.join(directory, child.name);
      const stat = await fsImpl.lstat(absolute);
      if (stat.isSymbolicLink()) fail(`Extracted source contains a symlink: ${relative}`, 'extraction_mismatch');
      if (stat.isDirectory()) await walk(absolute, relative);
      else if (stat.isFile()) foundPaths.push(relative);
      else fail(`Extracted source contains an unsupported entry: ${relative}`, 'extraction_mismatch');
    }
  }
  await walk(extractionRoot);
  foundPaths.sort(compareCanonicalPath);
  const expectedPaths = sourceEntries.map((entry) => entry.path);
  if (!jsonEquals(foundPaths, expectedPaths)) fail('Extracted source path set changed.', 'extraction_mismatch');
  for (const entry of sourceEntries) {
    const bytes = await fsImpl.readFile(path.join(extractionRoot, ...entry.path.split('/')));
    if (gitBlobSha(bytes) !== entry.objectSha) fail(`Extracted source blob changed: ${entry.path}`, 'extraction_mismatch');
  }
}

export async function extractImmutableGitSource({
  gitExecutable,
  controllerRoot,
  repositoryRoot,
  expectedRemoteUrl,
  extractionRoot,
  nodeVersion = process.version,
  trustedControllerRoot = TRUSTED_CONTROLLER_ROOT,
  runCommand = runDirectCommand,
  fsImpl = fs,
}) {
  const git = validateGitExecutable(gitExecutable);
  for (const [value, label] of [[controllerRoot, 'Controller root'], [repositoryRoot, 'Repository root'], [trustedControllerRoot, 'Trusted controller root']]) {
    if (typeof value !== 'string' || !path.isAbsolute(value)) fail(`${label} must be absolute.`, 'build_input_invalid');
  }
  const resolvedController = path.resolve(controllerRoot);
  const resolvedRepository = path.resolve(repositoryRoot);
  if (!pathsEqual(resolvedController, trustedControllerRoot) || !pathsEqual(resolvedRepository, resolvedController)) {
    fail('Release extraction must run from the trusted controller repository.', 'build_input_invalid');
  }
  requireString(expectedRemoteUrl, 'Expected private remote');
  const realExtractionRoot = await verifyFreshExtractionRoot(extractionRoot, resolvedRepository, fsImpl);

  const gitCall = async (args) => {
    try {
      return await runCommand({
        executable: git,
        args,
        cwd: resolvedRepository,
        input: null,
        shell: false,
        env: createGitCommandEnvironment(git),
      });
    } catch (error) {
      if (error instanceof ArtifactValidationError) throw error;
      fail('Git command failed.', 'command_failed');
    }
  };
  const readState = async () => {
    const topLevel = commandText(await gitCall(['rev-parse', '--show-toplevel']), 'Repository root');
    const status = commandText(await gitCall(['status', '--porcelain=v1', '--untracked-files=all']), 'Git status');
    const branch = commandText(await gitCall(['branch', '--show-current']), 'Git branch');
    const headSha = commandText(await gitCall(['rev-parse', '--verify', 'HEAD']), 'HEAD');
    const originMainSha = commandText(await gitCall(['rev-parse', '--verify', 'refs/remotes/origin/main']), 'origin/main');
    const remoteUrl = commandText(await gitCall(['remote', 'get-url', 'origin']), 'Origin remote');
    const sourceTreeSha = commandText(await gitCall(['rev-parse', '--verify', 'HEAD^{tree}']), 'HEAD tree');
    if (!pathsEqual(topLevel, resolvedRepository) || status !== '' || branch !== 'main'
        || !SHA1.test(headSha) || headSha !== originMainSha || remoteUrl !== expectedRemoteUrl || !SHA1.test(sourceTreeSha)) {
      fail('Repository is not the expected clean exact main source.', 'build_input_invalid');
    }
    return { status, branch, headSha, originMainSha, remoteUrl, sourceTreeSha };
  };

  const initial = await readState();
  const treeResult = await gitCall(['ls-tree', '-rz', '--full-tree', initial.headSha]);
  const sourceEntries = parseGitTree(treeResult.stdout);
  if (sourceEntries.length === 0) fail('Verified Git tree is empty.', 'git_tree_invalid');

  for (const entry of sourceEntries) {
    const blob = await gitCall(['cat-file', 'blob', entry.objectSha]);
    if (gitBlobSha(blob.stdout) !== entry.objectSha) fail(`Git blob identity mismatch: ${entry.path}`, 'git_tree_invalid');
    const destination = path.join(extractionRoot, ...entry.path.split('/'));
    if (!pathIsInside(extractionRoot, destination)) fail('Extracted path escaped the temporary root.', 'extraction_mismatch');
    await fsImpl.mkdir(path.dirname(destination), { recursive: true });
    const realParent = await fsImpl.realpath(path.dirname(destination));
    if (!pathIsInside(realExtractionRoot, realParent)
        || !pathsEqual(realParent, path.dirname(destination))) {
      fail(`Extracted source parent redirects elsewhere: ${entry.path}`, 'extraction_mismatch');
    }
    try {
      await fsImpl.writeFile(destination, blob.stdout, { flag: 'wx', mode: entry.mode === '100755' ? 0o755 : 0o644 });
    } catch {
      fail(`Extracted source path could not be created exclusively: ${entry.path}`, 'extraction_mismatch');
    }
  }
  await verifyExtractedEntries(extractionRoot, sourceEntries, fsImpl);
  const finalState = await readState();
  if (!jsonEquals(initial, finalState)) fail('Repository identity changed during immutable extraction.', 'source_changed');

  return validateImmutableBuildInput({
    branch: finalState.branch,
    controllerRoot: resolvedController,
    extractedPaths: sourceEntries.map((entry) => entry.path),
    extractedTreeSha: finalState.sourceTreeSha,
    extractionRoot: path.resolve(extractionRoot),
    gitStatus: finalState.status,
    gitExecutable: git,
    headSha: finalState.headSha,
    lockfilePath: path.join(path.resolve(extractionRoot), 'package-lock.json'),
    nodeVersion,
    originMainSha: finalState.originMainSha,
    remoteUrl: finalState.remoteUrl,
    repositoryRoot: resolvedRepository,
    sourceTreeSha: finalState.sourceTreeSha,
  }, {
    controllerRoot: resolvedController,
    gitExecutable: git,
    headSha: finalState.headSha,
    remoteUrl: expectedRemoteUrl,
    repositoryRoot: resolvedRepository,
  });
}

export function validateImmutableBuildInput(input, expected) {
  requireExactKeys(input, [
    'branch', 'controllerRoot', 'extractedPaths', 'extractedTreeSha', 'extractionRoot', 'gitStatus',
    'gitExecutable', 'headSha', 'lockfilePath', 'nodeVersion', 'originMainSha', 'remoteUrl', 'repositoryRoot', 'sourceTreeSha',
  ], 'Immutable build input');
  requireExactKeys(expected, ['controllerRoot', 'gitExecutable', 'headSha', 'remoteUrl', 'repositoryRoot'], 'Immutable build expectation');
  for (const key of ['controllerRoot', 'repositoryRoot', 'extractionRoot', 'lockfilePath', 'gitExecutable']) {
    if (typeof input[key] !== 'string' || !path.isAbsolute(input[key])) fail(`${key} must be absolute.`, 'build_input_invalid');
  }
  for (const key of ['controllerRoot', 'repositoryRoot', 'gitExecutable']) {
    if (typeof expected[key] !== 'string' || !path.isAbsolute(expected[key])) fail(`Expected ${key} must be absolute.`, 'build_input_invalid');
  }
  const inputGit = validateGitExecutable(input.gitExecutable);
  const expectedGit = validateGitExecutable(expected.gitExecutable);
  if (!pathsEqual(input.controllerRoot, expected.controllerRoot)
      || !pathsEqual(input.repositoryRoot, expected.repositoryRoot)
      || !pathsEqual(input.controllerRoot, input.repositoryRoot)
      || !pathsEqual(inputGit, expectedGit)) {
    fail('Controller must run from the expected repository root.', 'build_input_invalid');
  }
  if (pathIsInside(input.repositoryRoot, input.extractionRoot) || path.resolve(input.extractionRoot) === path.parse(input.extractionRoot).root) {
    fail('Extraction root must be a dedicated external temporary directory.', 'build_input_invalid');
  }
  if (input.remoteUrl !== expected.remoteUrl || input.branch !== 'main' || input.gitStatus !== '') {
    fail('Source checkout is not the expected clean main checkout.', 'build_input_invalid');
  }
  for (const key of ['headSha', 'originMainSha']) requireSha(input[key], SHA1, key);
  for (const key of ['sourceTreeSha', 'extractedTreeSha']) requireSha(input[key], SHA1, key);
  if (input.headSha !== expected.headSha || input.headSha !== input.originMainSha || input.sourceTreeSha !== input.extractedTreeSha) {
    fail('Source or extracted Git identity does not match.', 'build_input_invalid');
  }
  if (!/^v24\.\d+\.\d+$/.test(input.nodeVersion)) fail('Release builds require Node 24.', 'build_input_invalid');
  if (path.resolve(input.lockfilePath) !== path.join(path.resolve(input.extractionRoot), 'package-lock.json')) {
    fail('Release build must use the extracted npm lockfile.', 'build_input_invalid');
  }
  if (!Array.isArray(input.extractedPaths) || input.extractedPaths.length === 0) fail('Extracted Git tree is empty.', 'build_input_invalid');
  const normalized = input.extractedPaths.map(normalizeArtifactPath);
  const identities = normalized.map((entry) => entry.toLowerCase());
  if (new Set(normalized).size !== normalized.length || new Set(identities).size !== identities.length) {
    fail('Extracted Git paths are ambiguous.', 'build_input_invalid');
  }
  if (normalized.some((entry) => FORBIDDEN_BUILD_PATHS.test(entry)) || !normalized.includes('package-lock.json')
      || !normalized.includes('package.json') || !normalized.includes('index.html')) {
    fail('Extracted Git tree contains forbidden build state or lacks required inputs.', 'build_input_invalid');
  }
  return { ...input, extractedPaths: [...normalized].sort(compareCanonicalPath) };
}

function validateReleaseBinding(binding, label) {
  requireExactKeys(binding, [
    'admission', 'artifact', 'build', 'guidance', 'operatorUseModel', 'source', 'sourceContext',
  ], label);
  requireExactKeys(binding.source, ['commitSha', 'treeSha'], `${label} source`);
  requireSha(binding.source.commitSha, SHA1, `${label} commit SHA`);
  requireSha(binding.source.treeSha, SHA1, `${label} tree SHA`);
  requireExactKeys(binding.sourceContext, [
    'controllerRoot', 'expectedRemoteUrl', 'github', 'publishingChild', 'repositoryRoot', 'tools',
  ], `${label} source context`);
  for (const key of ['controllerRoot', 'repositoryRoot']) {
    if (typeof binding.sourceContext[key] !== 'string' || !path.isAbsolute(binding.sourceContext[key])) {
      fail(`${label} source context ${key} is invalid.`, 'decision_invalid');
    }
  }
  if (!pathsEqual(binding.sourceContext.controllerRoot, binding.sourceContext.repositoryRoot)) {
    fail(`${label} source context roots do not match.`, 'decision_invalid');
  }
  requireString(binding.sourceContext.expectedRemoteUrl, `${label} expected remote`);
  requireExactKeys(binding.sourceContext.tools, ['git', 'node', 'npm'], `${label} toolchain`);
  for (const [name, tool] of Object.entries(binding.sourceContext.tools)) {
    const keys = name === 'npm'
      ? ['digest', 'packageFileCount', 'packageRoot', 'packageTreeDigest', 'path', 'realPath']
      : ['digest', 'path', 'realPath'];
    requireExactKeys(tool, keys, `${label} ${name} tool`);
    for (const key of ['path', 'realPath']) {
      if (typeof tool[key] !== 'string' || !path.isAbsolute(tool[key])) fail(`${label} ${name} tool path is invalid.`, 'decision_invalid');
    }
    requireSha(tool.digest, SHA256_IDENTITY, `${label} ${name} tool digest`);
    if (name === 'npm') {
      if (typeof tool.packageRoot !== 'string' || !path.isAbsolute(tool.packageRoot)
          || !pathsEqual(tool.realPath, path.join(tool.packageRoot, 'bin', 'npm-cli.js'))
          || !Number.isSafeInteger(tool.packageFileCount) || tool.packageFileCount < 1) {
        fail(`${label} npm package identity is invalid.`, 'decision_invalid');
      }
      requireSha(tool.packageTreeDigest, SHA256_IDENTITY, `${label} npm package tree digest`);
    }
  }
  validateGitExecutable(binding.sourceContext.tools.git.path);
  requireExactKeys(binding.sourceContext.publishingChild, ['blobSha', 'digest', 'path'], `${label} publishing child`);
  normalizeArtifactPath(binding.sourceContext.publishingChild.path);
  requireSha(binding.sourceContext.publishingChild.blobSha, SHA1, `${label} publishing child blob`);
  requireSha(binding.sourceContext.publishingChild.digest, SHA256_IDENTITY, `${label} publishing child digest`);
  requireExactKeys(binding.sourceContext.github, ['apps', 'destination', 'digest'], `${label} GitHub binding`);
  requireSha(binding.sourceContext.github.digest, SHA256_IDENTITY, `${label} GitHub config digest`);
  requireExactKeys(binding.sourceContext.github.destination, ['branch', 'owner', 'repository'], `${label} destination`);
  requireExactKeys(binding.sourceContext.github.apps, ['bootstrap', 'publisher'], `${label} Apps`);
  for (const app of Object.values(binding.sourceContext.github.apps)) {
    requireExactKeys(app, ['appId', 'botLogin', 'installationId', 'owner'], `${label} App identity`);
  }
  requireExactKeys(binding.admission, ['forbiddenFragments'], `${label} admission`);
  const canonicalFragments = normalizeForbiddenFragments(binding.admission.forbiddenFragments);
  if (!jsonEquals(canonicalFragments, binding.admission.forbiddenFragments)) {
    fail(`${label} private identifier set is not canonical.`, 'decision_invalid');
  }
  requireExactKeys(binding.build, ['lockfileSha256', 'nodeVersion'], `${label} build`);
  requireSha(binding.build.lockfileSha256, SHA256_IDENTITY, `${label} lockfile digest`);
  if (!/^v24\.\d+\.\d+$/.test(binding.build.nodeVersion)) fail(`${label} Node version is unsupported.`, 'decision_invalid');
  requireExactKeys(binding.artifact, [
    'digestAlgorithm', 'footerDigest', 'identityVersion', 'manifestDigest', 'treeDigest',
  ], `${label} artifact`);
  if (binding.artifact.identityVersion !== ARTIFACT_SCHEMA || binding.artifact.digestAlgorithm !== DIGEST_ALGORITHM) {
    fail(`${label} artifact identity is unsupported.`, 'decision_invalid');
  }
  for (const key of ['footerDigest', 'manifestDigest', 'treeDigest']) {
    requireSha(binding.artifact[key], SHA256_IDENTITY, `${label} ${key}`);
  }
  if (!isPlainObject(binding.operatorUseModel) || Object.keys(binding.operatorUseModel).length === 0) {
    fail(`${label} operator/use model is required.`, 'decision_invalid');
  }
  validateGuidance(binding.guidance, `${label} guidance`);
  return binding;
}

function validateGuidance(guidance, label) {
  if (!Array.isArray(guidance) || guidance.length === 0) fail(`${label} is required.`, 'decision_invalid');
  const seen = new Set();
  return guidance.map((entry) => {
    requireExactKeys(entry, ['digest', 'id'], `${label} entry`);
    const id = requireString(entry.id, `${label} id`);
    if (seen.has(id)) fail(`${label} id is duplicated.`, 'decision_invalid');
    seen.add(id);
    return { id, digest: requireSha(entry.digest, SHA256_IDENTITY, `${label} digest`) };
  });
}

function parseInstant(value, label) {
  if (typeof value !== 'string' || !ISO_INSTANT.test(value) || !Number.isFinite(Date.parse(value))) {
    fail(`${label} must be an exact UTC instant.`, 'decision_invalid');
  }
  return Date.parse(value);
}

export function validateReleaseDecision(decision, expected, { phase, now = Date.now() } = {}) {
  requireExactKeys(decision, [
    'admission', 'artifact', 'build', 'decision', 'delivery', 'guidance', 'issuedAt', 'issuer', 'notAfter',
    'operatorUseModel', 'phaseRevalidation', 'schema', 'source', 'sourceContext',
  ], 'Release decision');
  validateReleaseBinding(expected, 'Release expectation');
  if (decision.schema !== RELEASE_DECISION_SCHEMA || decision.decision !== 'accepted') {
    fail('Release decision is not accepted under the supported schema.', 'decision_rejected');
  }
  validateReleaseBinding({
    source: decision.source,
    sourceContext: decision.sourceContext,
    admission: decision.admission,
    build: decision.build,
    artifact: decision.artifact,
    operatorUseModel: decision.operatorUseModel,
    guidance: decision.guidance,
  }, 'Release decision');
  if (!jsonEquals(decision.delivery, WORLDWIDE_DELIVERY)) {
    fail('This delivery architecture requires explicit unrestricted worldwide review.', 'decision_reach_mismatch');
  }
  if (!jsonEquals(decision.source, expected.source) || !jsonEquals(decision.sourceContext, expected.sourceContext)
      || !jsonEquals(decision.admission, expected.admission) || !jsonEquals(decision.build, expected.build)
      || !jsonEquals(decision.artifact, expected.artifact) || !jsonEquals(decision.operatorUseModel, expected.operatorUseModel)) {
    fail('Release decision does not bind the exact current release inputs.', 'decision_mismatch');
  }
  const actualGuidance = validateGuidance(decision.guidance, 'Reviewed guidance');
  const expectedGuidance = validateGuidance(expected.guidance, 'Expected guidance');
  if (!jsonEquals(actualGuidance, expectedGuidance)) fail('Reviewed guidance identity has changed.', 'decision_guidance_mismatch');
  requireString(decision.issuer, 'Decision issuer');
  const issuedAt = parseInstant(decision.issuedAt, 'issuedAt');
  const notAfter = parseInstant(decision.notAfter, 'notAfter');
  if (!Number.isFinite(now) || issuedAt > now || now > notAfter || issuedAt >= notAfter) {
    fail('Release decision is not currently fresh.', 'decision_stale');
  }
  requireExactKeys(decision.phaseRevalidation, ['confirmedAt', 'invalidatorsUnchanged', 'phase'], 'Phase revalidation');
  if (typeof phase !== 'string' || phase.length === 0 || decision.phaseRevalidation.phase !== phase
      || decision.phaseRevalidation.invalidatorsUnchanged !== true) {
    fail('A current phase-local owner revalidation is required.', 'decision_phase_mismatch');
  }
  const confirmedAt = parseInstant(decision.phaseRevalidation.confirmedAt, 'phaseRevalidation.confirmedAt');
  if (confirmedAt < issuedAt || confirmedAt > now || confirmedAt > notAfter) {
    fail('Phase-local revalidation is not fresh.', 'decision_stale');
  }
  return Object.freeze({
    schema: decision.schema,
    issuer: decision.issuer,
    phase,
    issuedAt: decision.issuedAt,
    notAfter: decision.notAfter,
    artifactTreeDigest: expected.artifact.treeDigest,
  });
}

export function createReleaseDecisionTemplate(expected, { phase } = {}) {
  validateReleaseBinding(expected, 'Release expectation');
  requireString(phase, 'Release phase');
  return {
    schema: RELEASE_DECISION_SCHEMA,
    decision: 'rejected',
    source: expected.source,
    sourceContext: expected.sourceContext,
    admission: expected.admission,
    build: expected.build,
    artifact: expected.artifact,
    operatorUseModel: expected.operatorUseModel,
    delivery: WORLDWIDE_DELIVERY,
    guidance: expected.guidance,
    issuer: '',
    issuedAt: '',
    notAfter: '',
    phaseRevalidation: { phase, confirmedAt: '', invalidatorsUnchanged: false },
  };
}

function cloneJson(value) {
  return JSON.parse(canonicalJson(value));
}

function cloneFiles(files) {
  return files.map((file) => ({ path: file.path, mode: file.mode, bytes: Buffer.from(file.bytes) }));
}

function boundPrivateFragments(buildInput, suppliedFragments, privateBindings) {
  const supplied = normalizeForbiddenFragments(suppliedFragments);
  const derived = [
    buildInput.controllerRoot,
    buildInput.repositoryRoot,
    buildInput.extractionRoot,
    buildInput.gitExecutable,
    buildInput.remoteUrl,
    ...Object.values(privateBindings.tools).flatMap((tool) => [tool.path, tool.realPath]),
  ].flatMap((value) => [value, value.replaceAll('\\', '/'), value.replaceAll('/', '\\')]);
  return normalizeForbiddenFragments([...supplied, ...derived], { rejectDuplicates: false });
}

function validateRasterSourceClosure(sourceFiles, generatedFiles) {
  if (!Array.isArray(sourceFiles)) fail('Source asset snapshot is invalid.', 'orchestration_invalid');
  const sourceRasterDigests = new Set();
  for (const file of sourceFiles) {
    if (!file || typeof file.path !== 'string' || !/\.(?:png|webp)$/.test(file.path)) continue;
    if (!Buffer.isBuffer(file.bytes)) fail(`Source raster is invalid: ${file.path}`, 'type_invalid');
    if (!stripRasterMetadata(file.path, file.bytes).equals(file.bytes)) {
      fail(`Source raster metadata is forbidden: ${file.path}`, 'content_forbidden');
    }
    sourceRasterDigests.add(sha256(file.bytes));
  }
  for (const file of generatedFiles) {
    if (!file || typeof file.path !== 'string' || !/\.(?:png|webp)$/.test(file.path)) continue;
    if (!Buffer.isBuffer(file.bytes) || !sourceRasterDigests.has(sha256(file.bytes))) {
      fail(`Generated raster does not match the immutable source snapshot: ${file.path}`, 'content_forbidden');
    }
  }
}

export async function buildCandidateArtifact({
  buildInput,
  buildExpectation,
  install,
  build,
  readGeneratedFiles,
  releaseContext,
  phase,
  forbiddenFragments = [],
  inertExternalUrlExceptions = [],
  inertRuntimeApiExceptions = [],
  privateBindings,
}) {
  const verifiedBuildInput = validateImmutableBuildInput(buildInput, buildExpectation);
  if (![install, build, readGeneratedFiles].every((value) => typeof value === 'function')) {
    fail('Artifact preparation callbacks are incomplete.', 'orchestration_invalid');
  }
  requireExactKeys(
    releaseContext,
    ['footerDigest', 'guidance', 'lockfileSha256', 'operatorUseModel'],
    'Release context',
  );
  requireString(phase, 'Release phase');
  requireExactKeys(privateBindings, ['github', 'publishingChild', 'tools'], 'Private execution bindings');
  const sourceRasterFiles = await readGeneratedFiles({ root: path.join(verifiedBuildInput.extractionRoot, 'src', 'assets') });
  await install({ cwd: verifiedBuildInput.extractionRoot, command: 'npm', args: ['ci', '--ignore-scripts'] });
  await build({ cwd: verifiedBuildInput.extractionRoot, command: 'npm', args: ['run', 'build'] });
  const generatedFiles = await readGeneratedFiles({ root: path.join(verifiedBuildInput.extractionRoot, 'dist') });
  if (!Array.isArray(generatedFiles) || !generatedFiles.some((file) => file.path === '.nojekyll')) {
    fail('Generated output must include the public host control file.', 'tree_invalid');
  }
  validateRasterSourceClosure(sourceRasterFiles, generatedFiles);
  const files = cloneFiles(generatedFiles)
    .sort((left, right) => compareCanonicalPath(left.path, right.path));
  const admission = cloneJson({
    forbiddenFragments: boundPrivateFragments(verifiedBuildInput, forbiddenFragments, privateBindings),
    inertExternalUrlExceptions,
    inertRuntimeApiExceptions,
  });
  const manifest = createArtifactManifest(files, admission);
  const footerDigest = deriveFooterDigest(files);
  if (releaseContext.footerDigest !== footerDigest) {
    fail('Caller footer digest does not match the exact emitted wording.', 'footer_invalid');
  }
  const expectation = {
    source: { commitSha: verifiedBuildInput.headSha, treeSha: verifiedBuildInput.sourceTreeSha },
    sourceContext: {
      controllerRoot: verifiedBuildInput.controllerRoot,
      expectedRemoteUrl: verifiedBuildInput.remoteUrl,
      github: cloneJson(privateBindings.github),
      publishingChild: cloneJson(privateBindings.publishingChild),
      repositoryRoot: verifiedBuildInput.repositoryRoot,
      tools: cloneJson(privateBindings.tools),
    },
    admission: { forbiddenFragments: admission.forbiddenFragments },
    build: {
      nodeVersion: verifiedBuildInput.nodeVersion,
      lockfileSha256: releaseContext.lockfileSha256,
    },
    artifact: {
      identityVersion: ARTIFACT_SCHEMA,
      digestAlgorithm: DIGEST_ALGORITHM,
      treeDigest: manifest.treeDigest,
      manifestDigest: manifest.manifestDigest,
      footerDigest,
    },
    operatorUseModel: cloneJson(releaseContext.operatorUseModel),
    guidance: cloneJson(releaseContext.guidance),
  };
  validateReleaseBinding(expectation, 'Release expectation');
  const template = createReleaseDecisionTemplate(expectation, { phase });
  return {
    schema: ARTIFACT_CANDIDATE_SCHEMA,
    files,
    manifest: cloneJson(manifest),
    expectation: cloneJson(expectation),
    template: cloneJson(template),
    admission,
  };
}

export async function acceptPreparedArtifact({
  candidate,
  decision,
  phase,
  now = Date.now(),
  onAccepted,
}) {
  requireExactKeys(candidate, ['admission', 'expectation', 'files', 'manifest', 'schema', 'template'], 'Artifact candidate');
  if (candidate.schema !== ARTIFACT_CANDIDATE_SCHEMA || !Array.isArray(candidate.files) || typeof onAccepted !== 'function') {
    fail('Prepared artifact candidate is invalid.', 'candidate_invalid');
  }
  requireExactKeys(
    candidate.admission,
    ['forbiddenFragments', 'inertExternalUrlExceptions', 'inertRuntimeApiExceptions'],
    'Artifact admission policy',
  );
  let canonicalCandidateFragments;
  try {
    canonicalCandidateFragments = normalizeForbiddenFragments(candidate.admission.forbiddenFragments);
  } catch {
    fail('Prepared artifact admission changed after review preparation.', 'candidate_changed');
  }
  if (!jsonEquals(canonicalCandidateFragments, candidate.admission.forbiddenFragments)
      || !jsonEquals(candidate.expectation?.admission, {
        forbiddenFragments: canonicalCandidateFragments,
      })) {
    fail('Prepared artifact admission changed after review preparation.', 'candidate_changed');
  }
  const recomputedManifest = createArtifactManifest(candidate.files, candidate.admission);
  if (!jsonEquals(recomputedManifest, candidate.manifest)) {
    fail('Prepared artifact bytes or manifest changed after review preparation.', 'candidate_changed');
  }
  validateReleaseBinding(candidate.expectation, 'Release expectation');
  if (candidate.expectation.artifact.treeDigest !== recomputedManifest.treeDigest
      || candidate.expectation.artifact.manifestDigest !== recomputedManifest.manifestDigest
      || candidate.expectation.artifact.footerDigest !== deriveFooterDigest(candidate.files)) {
    fail('Prepared artifact expectation no longer matches its retained bytes.', 'candidate_changed');
  }
  const preparedPhase = candidate.template?.phaseRevalidation?.phase;
  const expectedTemplate = createReleaseDecisionTemplate(candidate.expectation, { phase: preparedPhase });
  if (!jsonEquals(candidate.template, expectedTemplate)) {
    fail('Prepared artifact decision template changed.', 'candidate_changed');
  }
  const accepted = validateReleaseDecision(decision, candidate.expectation, { phase, now });
  return onAccepted({
    files: cloneFiles(candidate.files),
    manifest: cloneJson(recomputedManifest),
    expectation: cloneJson(candidate.expectation),
    accepted,
  });
}

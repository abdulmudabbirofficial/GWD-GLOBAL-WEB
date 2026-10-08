/**
 * Detects image type from magic bytes. The browser-declared MIME type and file
 * extension are attacker-controlled, so they are never trusted. SVG is not
 * accepted: it can carry script and would need sanitising to be served safely.
 */
export type SniffedImage = { mime: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif' | 'image/gif'; ext: string };

const startsWith = (buf: Uint8Array, bytes: number[], offset = 0) => bytes.every((b, i) => buf[offset + i] === b);
const ascii = (buf: Uint8Array, offset: number, text: string) =>
  startsWith(
    buf,
    [...text].map((c) => c.charCodeAt(0)),
    offset,
  );

export function sniffImage(buf: Uint8Array): SniffedImage | null {
  if (buf.length < 12) return null;
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: 'image/png', ext: 'png' };
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg' };
  if (ascii(buf, 0, 'RIFF') && ascii(buf, 8, 'WEBP')) return { mime: 'image/webp', ext: 'webp' };
  if (ascii(buf, 4, 'ftypavif') || ascii(buf, 4, 'ftypavis')) return { mime: 'image/avif', ext: 'avif' };
  if (ascii(buf, 0, 'GIF87a') || ascii(buf, 0, 'GIF89a')) return { mime: 'image/gif', ext: 'gif' };
  return null;
}

/** Reads pixel dimensions for PNG/GIF headers where it is trivial; null otherwise. */
export function readDimensions(buf: Uint8Array, mime: SniffedImage['mime']): { width: number; height: number } | null {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (mime === 'image/png' && buf.length >= 24) return { width: view.getUint32(16), height: view.getUint32(20) };
  if (mime === 'image/gif' && buf.length >= 10) return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  return null;
}

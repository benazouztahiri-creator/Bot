export function getRealMimeType(buf: Buffer): string | null {
  if (buf.length < 8) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return "image/webp";
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf";

  return null;
}

export function validateImageMime(buf: Buffer): boolean {
  const real = getRealMimeType(buf);
  return !!real && real.startsWith("image/");
}

export function isAllowedFile(buf: Buffer, allowedTypes: string[]): boolean {
  const real = getRealMimeType(buf);
  return !!real && allowedTypes.includes(real);
}

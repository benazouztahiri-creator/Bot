export const MAX_LENGTHS = {
  TITLE: 100,
  DESCRIPTION: 2000,
  COMMENT: 500,
  MESSAGE: 2000,
  REASON: 500,
  NOTIF_TITLE: 200,
  NOTIF_MESSAGE: 500,
  FIRST_NAME: 50,
  LAST_NAME: 50,
  EMAIL: 254,
  PASSWORD: 128,
  RESOLUTION_NOTE: 1000,
  CATEGORY: 30,
  CURRENCY: 10,
  LINK: 500,
} as const;

export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

export function sanitizeText(input: string, maxLength: number): string {
  let cleaned = stripHtml(input);
  cleaned = cleaned.trim();
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }
  return cleaned;
}

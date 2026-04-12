export type CommonTimezone = (typeof COMMON_TIMEZONES)[number];
export const COMMON_TIMEZONES = [
  // Asia
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Kolkata",
  "Asia/Dubai",

  // Europe
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Moscow",

  // North America
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Mexico_City",

  // South America
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "America/Lima",

  // Australia
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",

  // Africa
  "Africa/Cairo",
  "Africa/Nairobi",
] as const;

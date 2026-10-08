import type { Location } from '@/types/content';

/** Operating footprint, headquarters in Hyderabad plus nine markets. */
export const locations: Omit<Location, 'id'>[] = [
  { city: 'Hyderabad', country: 'India', countryCode: 'IN', timezone: 'Asia/Kolkata', isHq: true, latitude: 17.385, longitude: 78.4867 },
  { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', timezone: 'Asia/Dubai', isHq: false, latitude: 25.2048, longitude: 55.2708 },
  { city: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA', timezone: 'Asia/Riyadh', isHq: false, latitude: 24.7136, longitude: 46.6753 },
  { city: 'Doha', country: 'Qatar', countryCode: 'QA', timezone: 'Asia/Qatar', isHq: false, latitude: 25.2854, longitude: 51.531 },
  { city: 'Kuwait City', country: 'Kuwait', countryCode: 'KW', timezone: 'Asia/Kuwait', isHq: false, latitude: 29.3759, longitude: 47.9774 },
  { city: 'Istanbul', country: 'Turkey', countryCode: 'TR', timezone: 'Europe/Istanbul', isHq: false, latitude: 41.0082, longitude: 28.9784 },
  { city: 'London', country: 'United Kingdom', countryCode: 'GB', timezone: 'Europe/London', isHq: false, latitude: 51.5074, longitude: -0.1278 },
  { city: 'Berlin', country: 'Germany', countryCode: 'DE', timezone: 'Europe/Berlin', isHq: false, latitude: 52.52, longitude: 13.405 },
  { city: 'Singapore', country: 'Singapore', countryCode: 'SG', timezone: 'Asia/Singapore', isHq: false, latitude: 1.3521, longitude: 103.8198 },
  { city: 'Toronto', country: 'Canada', countryCode: 'CA', timezone: 'America/Toronto', isHq: false, latitude: 43.6532, longitude: -79.3832 },
];

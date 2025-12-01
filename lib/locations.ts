// Location definitions with addresses
export type LocationKey = 'Portland' | 'I5 Corridor' | 'Salem' | 'Eugene';

export interface LocationInfo {
  name: string;
  address: string;
  city: string;
  fullAddress: string;
  note?: string;
}

export const LOCATIONS: Record<LocationKey, LocationInfo> = {
  'Portland': {
    name: 'Jantzen Beach Target',
    address: '1555 N Tomahawk Island Dr',
    city: 'Portland, OR 97217',
    fullAddress: 'Jantzen Beach Target\n1555 N Tomahawk Island Dr\nPortland, OR 97217',
  },
  'I5 Corridor': {
    name: 'I5 Corridor',
    address: 'Between Portland and Eugene',
    city: '',
    fullAddress: 'Between Portland and Eugene',
    note: 'Message courier to set location',
  },
  'Salem': {
    name: 'Public Service Building',
    address: '255 Capitol St NE',
    city: 'Salem, OR 97310',
    fullAddress: 'Public Service Building\n255 Capitol St NE\nSalem, OR 97310',
  },
  'Eugene': {
    name: 'Self Delivery',
    address: 'Will deliver my own meal',
    city: '',
    fullAddress: 'Will deliver my own meal - no courier needed',
    note: 'No courier needed',
  },
};

// Allowed dates for meal signups (December 2025 weekends)
export const ALLOWED_DATES = [
  '2025-12-06', // Saturday
  '2025-12-07', // Sunday
  '2025-12-13', // Saturday
  '2025-12-14', // Sunday
  '2025-12-20', // Saturday
  '2025-12-21', // Sunday
];

export function getLocationInfo(location: string): LocationInfo | null {
  return LOCATIONS[location as LocationKey] || null;
}

export function getLocationDisplayText(location: string): string {
  const info = getLocationInfo(location);
  if (!info) return location;

  if (info.note) {
    return `${info.name} - ${info.address}${info.city ? ', ' + info.city : ''} (${info.note})`;
  }
  return `${info.name} - ${info.address}${info.city ? ', ' + info.city : ''}`;
}

export function getLocationAddress(location: string): string {
  const info = getLocationInfo(location);
  if (!info) return location;
  return info.fullAddress;
}

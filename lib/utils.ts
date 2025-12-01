import { format, isValid } from 'date-fns';

// Handle both Date objects and ISO strings from database
// Parses dates as local dates to avoid timezone shifting
function toDate(input: string | Date): Date {
  if (input instanceof Date) {
    // For Date objects, extract the UTC date parts to avoid timezone shift
    const year = input.getUTCFullYear();
    const month = input.getUTCMonth();
    const day = input.getUTCDate();
    return new Date(year, month, day);
  }

  // For strings, parse as local date
  const dateStr = String(input).split('T')[0]; // Get just the date part
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

export function formatDate(dateInput: string | Date): string {
  try {
    const date = toDate(dateInput);
    if (!isValid(date)) return String(dateInput);
    return format(date, 'MMMM d, yyyy');
  } catch {
    return String(dateInput);
  }
}

export function formatDateShort(dateInput: string | Date): string {
  try {
    const date = toDate(dateInput);
    if (!isValid(date)) return String(dateInput);
    return format(date, 'MMM d, yyyy');
  } catch {
    return String(dateInput);
  }
}

export function formatDateForDisplay(dateInput: string | Date): string {
  try {
    const date = toDate(dateInput);
    if (!isValid(date)) return String(dateInput);
    return format(date, 'EEEE, MMMM d, yyyy');
  } catch {
    return String(dateInput);
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  // Accept various phone formats
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function groupMealsByDate<T extends { pickup_date: string }>(
  meals: T[]
): Record<string, T[]> {
  return meals.reduce((acc, meal) => {
    const date = meal.pickup_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(meal);
    return acc;
  }, {} as Record<string, T[]>);
}

import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateString: string): string {
  const date = parseISO(dateString);
  if (!isValid(date)) return dateString;
  return format(date, 'MMMM d, yyyy');
}

export function formatDateShort(dateString: string): string {
  const date = parseISO(dateString);
  if (!isValid(date)) return dateString;
  return format(date, 'MMM d, yyyy');
}

export function formatDateForDisplay(dateString: string): string {
  const date = parseISO(dateString);
  if (!isValid(date)) return dateString;
  return format(date, 'EEEE, MMMM d, yyyy');
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

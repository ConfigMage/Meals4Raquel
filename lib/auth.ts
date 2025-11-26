import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Meals4Raquel';
const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_VALUE = 'authenticated';

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get(SESSION_COOKIE_NAME);
  return adminSession?.value === SESSION_VALUE;
}

export async function setAdminAuth(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function clearAdminAuth(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

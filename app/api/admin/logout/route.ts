import { NextResponse } from 'next/server';
import { clearAdminAuth } from '@/lib/auth';

export async function POST() {
  try {
    await clearAdminAuth();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

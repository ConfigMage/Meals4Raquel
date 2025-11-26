import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const pickupLocations = await sql`
      SELECT id, pickup_date, location, active, created_at
      FROM pickup_locations
      WHERE active = true
        AND pickup_date >= CURRENT_DATE
      ORDER BY pickup_date ASC, location ASC
    `;

    return NextResponse.json(pickupLocations);
  } catch (error) {
    console.error('Error fetching pickup locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pickup locations' },
      { status: 500 }
    );
  }
}

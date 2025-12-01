import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';

export async function GET() {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pickupLocations = await sql`
      SELECT id, pickup_date, location, active, created_at
      FROM pickup_locations
      ORDER BY pickup_date DESC, location ASC
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

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pickupDate, location } = body;

    if (!pickupDate || !location) {
      return NextResponse.json(
        { error: 'Pickup date and location are required' },
        { status: 400 }
      );
    }

    if (!['Salem', 'Portland', 'Eugene', 'I5 Corridor'].includes(location)) {
      return NextResponse.json(
        { error: 'Invalid location. Must be Salem, Portland, Eugene, or I5 Corridor' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO pickup_locations (pickup_date, location, active)
      VALUES (${pickupDate}, ${location}, true)
      ON CONFLICT (pickup_date, location) DO NOTHING
      RETURNING id, pickup_date, location, active, created_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Pickup location already exists for this date and location' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      pickupLocation: result[0],
    });
  } catch (error) {
    console.error('Error creating pickup location:', error);
    return NextResponse.json(
      { error: 'Failed to create pickup location' },
      { status: 500 }
    );
  }
}

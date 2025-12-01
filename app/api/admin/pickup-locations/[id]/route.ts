import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { pickupDate, location, active } = body;

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

    // Check if another record with the same date/location exists
    const existing = await sql`
      SELECT id FROM pickup_locations
      WHERE pickup_date = ${pickupDate}::date
        AND location = ${location}
        AND id != ${id}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `A pickup location for ${location} on ${pickupDate} already exists` },
        { status: 409 }
      );
    }

    const result = await sql`
      UPDATE pickup_locations
      SET pickup_date = ${pickupDate},
          location = ${location},
          active = ${active ?? true}
      WHERE id = ${id}
      RETURNING id, pickup_date, location, active, created_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Pickup location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pickupLocation: result[0],
    });
  } catch (error) {
    console.error('Error updating pickup location:', error);
    return NextResponse.json(
      { error: 'Failed to update pickup location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if there are any meal signups for this location
    const signups = await sql`
      SELECT COUNT(*) as count
      FROM meal_signups
      WHERE pickup_location_id = ${id}
    `;

    if (parseInt(signups[0].count, 10) > 0) {
      // Instead of deleting, just deactivate
      await sql`
        UPDATE pickup_locations
        SET active = false
        WHERE id = ${id}
      `;

      return NextResponse.json({
        success: true,
        message: 'Pickup location deactivated (has existing signups)',
      });
    }

    const result = await sql`
      DELETE FROM pickup_locations
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Pickup location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pickup location deleted',
    });
  } catch (error) {
    console.error('Error deleting pickup location:', error);
    return NextResponse.json(
      { error: 'Failed to delete pickup location' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ALLOWED_DATES } from '@/lib/locations';

const LOCATIONS = ['Portland', 'I5 Corridor', 'Salem', 'Eugene'];

export async function POST() {
  try {
    const results = [];

    for (const date of ALLOWED_DATES) {
      for (const location of LOCATIONS) {
        try {
          // Check if this combination already exists
          const existing = await sql`
            SELECT id FROM pickup_locations
            WHERE pickup_date = ${date}::date
              AND location = ${location}
          `;

          if (existing.length === 0) {
            // Insert new pickup location
            const result = await sql`
              INSERT INTO pickup_locations (pickup_date, location, active)
              VALUES (${date}::date, ${location}, true)
              RETURNING id, pickup_date, location
            `;
            results.push({ action: 'created', ...result[0] });
          } else {
            results.push({ action: 'exists', id: existing[0].id, pickup_date: date, location });
          }
        } catch (err) {
          results.push({ action: 'error', date, location, error: String(err) });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} pickup locations`,
      results,
    });
  } catch (error) {
    console.error('Error seeding locations:', error);
    return NextResponse.json(
      { error: 'Failed to seed locations', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // List all pickup locations
    const locations = await sql`
      SELECT id, pickup_date, location, active, created_at
      FROM pickup_locations
      ORDER BY pickup_date ASC, location ASC
    `;

    return NextResponse.json({
      message: 'Current pickup locations. POST to seed, DELETE to clear all.',
      count: locations.length,
      locations,
      allowedDates: ALLOWED_DATES,
      allowedLocations: LOCATIONS,
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const confirm = url.searchParams.get('confirm');

    if (confirm !== 'yes') {
      return NextResponse.json({
        message: 'Add ?confirm=yes to delete all pickup locations without meal signups',
        warning: 'This will delete all pickup locations that have no meal signups',
      });
    }

    // Delete only locations without any signups
    const result = await sql`
      DELETE FROM pickup_locations
      WHERE id NOT IN (
        SELECT DISTINCT pickup_location_id FROM meal_signups
      )
      RETURNING id, pickup_date, location
    `;

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.length} pickup locations`,
      deleted: result,
    });
  } catch (error) {
    console.error('Error deleting locations:', error);
    return NextResponse.json(
      { error: 'Failed to delete locations', details: String(error) },
      { status: 500 }
    );
  }
}

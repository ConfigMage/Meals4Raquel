import { NextResponse } from 'next/server';
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
  return NextResponse.json({
    message: 'POST to this endpoint to seed all pickup locations',
    dates: ALLOWED_DATES,
    locations: LOCATIONS,
  });
}

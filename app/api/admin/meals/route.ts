import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const status = searchParams.get('status');

    let meals;

    if (location && status) {
      if (status === 'cancelled') {
        meals = await sql`
          SELECT
            ms.*,
            pl.pickup_date,
            pl.location
          FROM meal_signups ms
          JOIN pickup_locations pl ON ms.pickup_location_id = pl.id
          WHERE pl.location = ${location}
            AND ms.cancelled_at IS NOT NULL
          ORDER BY pl.pickup_date DESC, ms.created_at DESC
        `;
      } else {
        meals = await sql`
          SELECT
            ms.*,
            pl.pickup_date,
            pl.location
          FROM meal_signups ms
          JOIN pickup_locations pl ON ms.pickup_location_id = pl.id
          WHERE pl.location = ${location}
            AND ms.cancelled_at IS NULL
          ORDER BY pl.pickup_date DESC, ms.created_at DESC
        `;
      }
    } else if (location) {
      meals = await sql`
        SELECT
          ms.*,
          pl.pickup_date,
          pl.location
        FROM meal_signups ms
        JOIN pickup_locations pl ON ms.pickup_location_id = pl.id
        WHERE pl.location = ${location}
        ORDER BY pl.pickup_date DESC, ms.created_at DESC
      `;
    } else if (status) {
      if (status === 'cancelled') {
        meals = await sql`
          SELECT
            ms.*,
            pl.pickup_date,
            pl.location
          FROM meal_signups ms
          JOIN pickup_locations pl ON ms.pickup_location_id = pl.id
          WHERE ms.cancelled_at IS NOT NULL
          ORDER BY pl.pickup_date DESC, ms.created_at DESC
        `;
      } else {
        meals = await sql`
          SELECT
            ms.*,
            pl.pickup_date,
            pl.location
          FROM meal_signups ms
          JOIN pickup_locations pl ON ms.pickup_location_id = pl.id
          WHERE ms.cancelled_at IS NULL
          ORDER BY pl.pickup_date DESC, ms.created_at DESC
        `;
      }
    } else {
      meals = await sql`
        SELECT
          ms.*,
          pl.pickup_date,
          pl.location
        FROM meal_signups ms
        JOIN pickup_locations pl ON ms.pickup_location_id = pl.id
        ORDER BY pl.pickup_date DESC, ms.created_at DESC
      `;
    }

    return NextResponse.json(meals);
  } catch (error) {
    console.error('Error fetching meals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}

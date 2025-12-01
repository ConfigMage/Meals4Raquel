import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';
import { isValidEmail, isValidPhone } from '@/lib/utils';

export async function GET() {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const couriers = await sql`
      SELECT id, name, email, phone, locations, active, created_at
      FROM couriers
      ORDER BY name ASC
    `;

    return NextResponse.json(couriers);
  } catch (error) {
    console.error('Error fetching couriers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch couriers' },
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
    const { name, email, phone, locations } = body;

    if (!name || !email || !phone || !locations || locations.length === 0) {
      return NextResponse.json(
        { error: 'Name, email, phone, and at least one location are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Validate locations
    const validLocations = ['Salem', 'Portland', 'Eugene', 'I5 Corridor'];
    for (const loc of locations) {
      if (!validLocations.includes(loc)) {
        return NextResponse.json(
          { error: `Invalid location: ${loc}. Must be Salem, Portland, Eugene, or I5 Corridor` },
          { status: 400 }
        );
      }
    }

    const result = await sql`
      INSERT INTO couriers (name, email, phone, locations, active)
      VALUES (${name}, ${email}, ${phone}, ${locations}, true)
      RETURNING id, name, email, phone, locations, active, created_at
    `;

    return NextResponse.json({
      success: true,
      courier: result[0],
    });
  } catch (error) {
    console.error('Error creating courier:', error);
    return NextResponse.json(
      { error: 'Failed to create courier' },
      { status: 500 }
    );
  }
}

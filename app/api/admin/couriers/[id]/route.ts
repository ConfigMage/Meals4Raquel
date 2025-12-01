import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';
import { isValidEmail, isValidPhone } from '@/lib/utils';

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
    const { name, email, phone, locations, active } = body;

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
      UPDATE couriers
      SET name = ${name},
          email = ${email},
          phone = ${phone},
          locations = ${locations},
          active = ${active ?? true}
      WHERE id = ${id}
      RETURNING id, name, email, phone, locations, active, created_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Courier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      courier: result[0],
    });
  } catch (error) {
    console.error('Error updating courier:', error);
    return NextResponse.json(
      { error: 'Failed to update courier' },
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

    const result = await sql`
      DELETE FROM couriers
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Courier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Courier deleted',
    });
  } catch (error) {
    console.error('Error deleting courier:', error);
    return NextResponse.json(
      { error: 'Failed to delete courier' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';

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
      DELETE FROM meal_signups
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Meal signup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meal signup deleted',
    });
  } catch (error) {
    console.error('Error deleting meal signup:', error);
    return NextResponse.json(
      { error: 'Failed to delete meal signup' },
      { status: 500 }
    );
  }
}

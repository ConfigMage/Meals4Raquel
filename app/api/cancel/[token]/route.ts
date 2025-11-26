import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendEmail, generateCancellationEmail, generateCancellationConfirmationEmail } from '@/lib/email';
import { Courier } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Get meal details
    const meals = await sql`
      SELECT
        ms.id,
        ms.name,
        ms.email,
        ms.meal_description,
        ms.cancelled_at,
        pl.pickup_date,
        pl.location
      FROM meal_signups ms
      JOIN pickup_locations pl ON ms.pickup_location_id = pl.id
      WHERE ms.cancellation_token = ${token}::uuid
    `;

    if (meals.length === 0) {
      return NextResponse.json(
        { error: 'Invalid cancellation link' },
        { status: 404 }
      );
    }

    const meal = meals[0];

    return NextResponse.json({
      id: meal.id,
      name: meal.name,
      mealDescription: meal.meal_description,
      pickupDate: meal.pickup_date,
      location: meal.location,
      alreadyCancelled: !!meal.cancelled_at,
    });
  } catch (error) {
    console.error('Error fetching meal for cancellation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal details' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Get meal details before cancelling
    const meals = await sql`
      SELECT
        ms.id,
        ms.name,
        ms.email,
        ms.meal_description,
        ms.cancelled_at,
        ms.pickup_location_id,
        pl.pickup_date,
        pl.location
      FROM meal_signups ms
      JOIN pickup_locations pl ON ms.pickup_location_id = pl.id
      WHERE ms.cancellation_token = ${token}::uuid
    `;

    if (meals.length === 0) {
      return NextResponse.json(
        { error: 'Invalid cancellation link' },
        { status: 404 }
      );
    }

    const meal = meals[0];

    if (meal.cancelled_at) {
      return NextResponse.json(
        { error: 'This meal has already been cancelled' },
        { status: 400 }
      );
    }

    // Soft delete - set cancelled_at timestamp
    await sql`
      UPDATE meal_signups
      SET cancelled_at = NOW()
      WHERE id = ${meal.id}
    `;

    // Get remaining meals count for this location and date
    const remainingMeals = await sql`
      SELECT COUNT(*) as count
      FROM meal_signups
      WHERE pickup_location_id = ${meal.pickup_location_id}
        AND cancelled_at IS NULL
    `;

    const remainingCount = parseInt(remainingMeals[0].count, 10);

    // Get all couriers for this location
    const couriers = await sql`
      SELECT name, email, phone
      FROM couriers
      WHERE active = true
        AND ${meal.location} = ANY(locations)
    ` as Courier[];

    // Send cancellation notification to all couriers
    for (const courier of couriers) {
      try {
        await sendEmail(
          courier.email,
          `Meal Cancellation - ${meal.location} - ${meal.pickup_date}`,
          generateCancellationEmail(
            meal.name,
            meal.meal_description,
            meal.pickup_date,
            meal.location,
            remainingCount
          )
        );
      } catch (emailError) {
        console.error(`Failed to send cancellation email to courier ${courier.email}:`, emailError);
      }
    }

    // Send confirmation to the meal provider
    try {
      await sendEmail(
        meal.email,
        `Meal Cancellation Confirmed`,
        generateCancellationConfirmationEmail(
          meal.name,
          meal.meal_description,
          meal.pickup_date,
          meal.location
        )
      );
    } catch (emailError) {
      console.error('Failed to send cancellation confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Meal cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling meal:', error);
    return NextResponse.json(
      { error: 'Failed to cancel meal' },
      { status: 500 }
    );
  }
}

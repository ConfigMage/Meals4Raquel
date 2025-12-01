import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendEmail, generateConfirmationEmail, generateNewSignupNotificationEmail } from '@/lib/email';
import { isValidEmail, isValidPhone } from '@/lib/utils';
import { MealSignupFormData, MealsByLocation, MealWithLocation, Courier } from '@/types';

export async function GET() {
  try {
    const meals = await sql`
      SELECT
        ms.id,
        ms.pickup_location_id,
        ms.name,
        ms.phone,
        ms.email,
        ms.meal_description,
        ms.freezer_friendly,
        ms.can_bring_to_salem,
        ms.cancelled_at,
        ms.created_at,
        pl.pickup_date,
        pl.location
      FROM meal_signups ms
      JOIN pickup_locations pl ON ms.pickup_location_id = pl.id
      WHERE pl.pickup_date >= CURRENT_DATE
      ORDER BY pl.pickup_date ASC, ms.created_at ASC
    ` as MealWithLocation[];

    // Group by location
    const mealsByLocation: MealsByLocation = {
      Salem: [],
      Portland: [],
      Eugene: [],
      'I5 Corridor': [],
    };

    for (const meal of meals) {
      const location = meal.location as keyof MealsByLocation;
      if (mealsByLocation[location]) {
        mealsByLocation[location].push(meal);
      }
    }

    return NextResponse.json(mealsByLocation);
  } catch (error) {
    console.error('Error fetching meals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: MealSignupFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.phone || !body.email || !body.pickupLocationId || !body.mealDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone format
    if (!isValidPhone(body.phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Get pickup location details
    const pickupLocations = await sql`
      SELECT id, pickup_date, location
      FROM pickup_locations
      WHERE id = ${body.pickupLocationId}
        AND active = true
        AND pickup_date >= CURRENT_DATE
    `;

    if (pickupLocations.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or inactive pickup location' },
        { status: 400 }
      );
    }

    const pickupLocation = pickupLocations[0];

    // Insert meal signup
    const result = await sql`
      INSERT INTO meal_signups (
        pickup_location_id,
        name,
        phone,
        email,
        meal_description,
        freezer_friendly,
        note_to_courier,
        can_bring_to_salem
      ) VALUES (
        ${body.pickupLocationId},
        ${body.name},
        ${body.phone},
        ${body.email},
        ${body.mealDescription},
        ${body.freezerFriendly},
        ${body.noteToCourier || null},
        ${body.canBringToSalem}
      )
      RETURNING id, cancellation_token
    `;

    const mealId = result[0].id;
    const cancellationToken = result[0].cancellation_token;

    // Get couriers for this location
    const couriers = await sql`
      SELECT name, phone, email
      FROM couriers
      WHERE active = true
        AND ${pickupLocation.location} = ANY(locations)
    ` as Courier[];

    // Send confirmation email to the person signing up
    // Try to get the app URL from environment, or construct from Vercel system env vars
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
      || 'http://localhost:3000';
    const cancellationUrl = `${appUrl}/cancel/${cancellationToken}`;

    try {
      await sendEmail(
        body.email,
        `Meal Drop-off Confirmation - ${pickupLocation.pickup_date}`,
        generateConfirmationEmail(
          body.name,
          pickupLocation.pickup_date,
          pickupLocation.location,
          body.mealDescription,
          body.freezerFriendly,
          cancellationUrl,
          couriers.map(c => ({ name: c.name, phone: c.phone, email: c.email }))
        )
      );
      console.log(`Confirmation email sent to ${body.email}`);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Get total meals count for this location/date
    const mealsCount = await sql`
      SELECT COUNT(*) as count
      FROM meal_signups
      WHERE pickup_location_id = ${body.pickupLocationId}
        AND cancelled_at IS NULL
    `;
    const totalMeals = parseInt(mealsCount[0].count, 10);

    // Send notification to all couriers for this location
    for (const courier of couriers) {
      try {
        await sendEmail(
          courier.email,
          `New Meal Signup - ${pickupLocation.location} - ${pickupLocation.pickup_date}`,
          generateNewSignupNotificationEmail(
            body.name,
            body.phone,
            body.mealDescription,
            body.freezerFriendly,
            body.canBringToSalem,
            body.noteToCourier || null,
            pickupLocation.pickup_date,
            pickupLocation.location,
            totalMeals
          )
        );
        console.log(`Notification sent to courier ${courier.email}`);
      } catch (emailError) {
        console.error(`Failed to send notification to courier ${courier.email}:`, emailError);
      }
    }

    return NextResponse.json({
      success: true,
      mealId,
      message: 'Meal signup successful! Check your email for confirmation.',
    });
  } catch (error) {
    console.error('Error creating meal signup:', error);
    return NextResponse.json(
      { error: 'Failed to create meal signup' },
      { status: 500 }
    );
  }
}

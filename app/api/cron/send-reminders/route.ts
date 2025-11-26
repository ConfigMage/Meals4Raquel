import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import {
  sendEmail,
  generateReminderEmail,
  generateCourierSummaryEmail,
} from '@/lib/email';
import { addDays, format } from 'date-fns';
import { Courier, MealSignup } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Verify Vercel Cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    console.log(`Sending reminders for ${tomorrow}`);

    // Get all active pickup locations for tomorrow
    const pickupLocations = await sql`
      SELECT id, pickup_date, location
      FROM pickup_locations
      WHERE pickup_date = ${tomorrow}
        AND active = true
    `;

    if (pickupLocations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pickups scheduled for tomorrow',
        date: tomorrow,
      });
    }

    let remindersSent = 0;
    let courierSummariesSent = 0;

    for (const location of pickupLocations) {
      // Get all non-cancelled meals for this location
      const meals = await sql`
        SELECT
          ms.id,
          ms.name,
          ms.phone,
          ms.email,
          ms.meal_description,
          ms.freezer_friendly,
          ms.can_bring_to_salem,
          ms.note_to_courier
        FROM meal_signups ms
        WHERE ms.pickup_location_id = ${location.id}
          AND ms.cancelled_at IS NULL
      ` as MealSignup[];

      if (meals.length === 0) {
        console.log(`No meals for ${location.location} on ${tomorrow}`);
        continue;
      }

      // Get couriers for this location
      const couriers = await sql`
        SELECT name, phone, email
        FROM couriers
        WHERE active = true
          AND ${location.location} = ANY(locations)
      ` as Courier[];

      const courierInfo = couriers.map((c) => ({
        name: c.name,
        phone: c.phone,
        email: c.email,
      }));

      // Send reminder to each meal provider
      for (const meal of meals) {
        try {
          await sendEmail(
            meal.email,
            `Reminder: Meal Drop-off Tomorrow - ${format(new Date(tomorrow), 'MMMM d, yyyy')}`,
            generateReminderEmail(
              meal.name,
              tomorrow,
              location.location,
              meal.meal_description,
              courierInfo
            )
          );
          remindersSent++;
          console.log(`Sent reminder to ${meal.email}`);
        } catch (error) {
          console.error(`Failed to send reminder to ${meal.email}:`, error);
        }
      }

      // Send summary to all couriers for this location
      for (const courier of couriers) {
        try {
          await sendEmail(
            courier.email,
            `Meal Pickup Summary - ${location.location} - ${format(new Date(tomorrow), 'MMMM d, yyyy')}`,
            generateCourierSummaryEmail(
              location.location,
              tomorrow,
              meals.map((m) => ({
                name: m.name,
                phone: m.phone,
                meal_description: m.meal_description,
                freezer_friendly: m.freezer_friendly,
                can_bring_to_salem: m.can_bring_to_salem,
                note_to_courier: m.note_to_courier,
              }))
            )
          );
          courierSummariesSent++;
          console.log(`Sent summary to courier ${courier.email}`);
        } catch (error) {
          console.error(`Failed to send summary to courier ${courier.email}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reminders sent successfully',
      date: tomorrow,
      stats: {
        pickupLocations: pickupLocations.length,
        remindersSent,
        courierSummariesSent,
      },
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
}

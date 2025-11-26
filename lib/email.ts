import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { formatDate } from './utils';
import { CourierInfo } from '@/types';

async function getAccessToken(): Promise<string> {
  const auth = new google.auth.JWT({
    email: process.env.GMAIL_CLIENT_EMAIL,
    key: process.env.GMAIL_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: process.env.SENDER_EMAIL,
  });

  const { token } = await auth.getAccessToken();
  return token || '';
}

async function createTransporter() {
  const accessToken = await getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.SENDER_EMAIL,
      serviceClient: process.env.GMAIL_CLIENT_EMAIL,
      privateKey: process.env.GMAIL_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      accessToken,
    },
  });
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  try {
    const transporter = await createTransporter();
    await transporter.sendMail({
      from: `"Meals for Raquel" <${process.env.SENDER_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export function generateConfirmationEmail(
  name: string,
  date: string,
  location: string,
  mealDescription: string,
  freezerFriendly: boolean,
  cancellationUrl: string,
  couriers: CourierInfo[]
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        h2 { color: #2563eb; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .highlight { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        .cancel-link { color: #dc2626; }
        .courier-info { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Thank you for coordinating a meal, ${name}!</h2>
        <p>Your meal drop-off has been confirmed:</p>

        <div class="info-box">
          <p><strong>Date:</strong> ${formatDate(date)}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Meal:</strong> ${mealDescription}</p>
          <p><strong>Freezer Friendly:</strong> ${freezerFriendly ? 'Yes' : 'No'}</p>
        </div>

        <div class="highlight">
          <p><strong>Please drop off by 2:00 PM</strong> at the ${location} location.</p>
        </div>

        <p>If you need to cancel, <a href="${cancellationUrl}" class="cancel-link">click here to cancel your meal signup</a>.</p>

        <div class="courier-info">
          <h3>Courier Contact${couriers.length > 1 ? 's' : ''}:</h3>
          ${couriers.map(c => `<p><strong>${c.name}:</strong> ${c.phone} (<a href="mailto:${c.email}">${c.email}</a>)</p>`).join('')}
        </div>

        <p>Thank you for your generosity!</p>
        <p>- The Meals for Raquel Team</p>
      </div>
    </body>
    </html>
  `;
}

export function generateReminderEmail(
  name: string,
  date: string,
  location: string,
  mealDescription: string,
  couriers: CourierInfo[]
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        h2 { color: #2563eb; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .highlight { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        .courier-info { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Reminder: Meal Drop-off Tomorrow!</h2>
        <p>Hi ${name},</p>
        <p>This is a friendly reminder that you're scheduled to drop off a meal tomorrow.</p>

        <div class="info-box">
          <p><strong>Date:</strong> ${formatDate(date)}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Your Meal:</strong> ${mealDescription}</p>
        </div>

        <div class="highlight">
          <p><strong>Please drop off by 2:00 PM</strong> at the ${location} location.</p>
        </div>

        <div class="courier-info">
          <h3>Need to reach a courier?</h3>
          ${couriers.map(c => `<p><strong>${c.name}:</strong> ${c.phone} (<a href="mailto:${c.email}">${c.email}</a>)</p>`).join('')}
        </div>

        <p>Thank you for your generosity!</p>
        <p>- The Meals for Raquel Team</p>
      </div>
    </body>
    </html>
  `;
}

export function generateCourierSummaryEmail(
  location: string,
  date: string,
  meals: Array<{
    name: string;
    phone: string;
    meal_description: string;
    freezer_friendly: boolean;
    can_bring_to_salem: boolean;
    note_to_courier: string | null;
  }>
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        h2 { color: #2563eb; }
        .summary-box { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e; }
        .meal-card { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e5e7eb; }
        .meal-card h3 { margin-top: 0; color: #374151; }
        .note { background: #fef3c7; padding: 10px; border-radius: 4px; margin-top: 10px; }
        hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Meal Pickup Summary - ${location}</h2>
        <p><strong>Date:</strong> ${formatDate(date)}</p>

        <div class="summary-box">
          <p><strong>Total Meals to Pick Up:</strong> ${meals.length}</p>
        </div>

        ${meals.map((meal, i) => `
          <div class="meal-card">
            <h3>Meal ${i + 1} of ${meals.length}</h3>
            <p><strong>From:</strong> ${meal.name}</p>
            <p><strong>Phone:</strong> ${meal.phone}</p>
            <p><strong>Meal:</strong> ${meal.meal_description}</p>
            <p><strong>Freezer Friendly:</strong> ${meal.freezer_friendly ? 'Yes' : 'No'}</p>
            <p><strong>Can Bring to Salem:</strong> ${meal.can_bring_to_salem ? 'Yes' : 'No'}</p>
            ${meal.note_to_courier ? `<div class="note"><strong>Note from Provider:</strong> ${meal.note_to_courier}</div>` : ''}
          </div>
        `).join('')}

        <hr>
        <p>Please ensure all meals are picked up by 2:00 PM.</p>
        <p>- The Meals for Raquel Team</p>
      </div>
    </body>
    </html>
  `;
}

export function generateCancellationEmail(
  providerName: string,
  mealDescription: string,
  date: string,
  location: string,
  remainingMealsCount: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        h2 { color: #dc2626; }
        .info-box { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626; }
        .update-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Meal Cancellation Notice</h2>
        <p>A meal has been cancelled for your pickup route.</p>

        <div class="info-box">
          <p><strong>Cancelled by:</strong> ${providerName}</p>
          <p><strong>Meal:</strong> ${mealDescription}</p>
          <p><strong>Date:</strong> ${formatDate(date)}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>

        <div class="update-box">
          <p><strong>Updated count:</strong> ${remainingMealsCount} meal${remainingMealsCount !== 1 ? 's' : ''} remaining for ${location} on ${formatDate(date)}.</p>
        </div>

        <p>- The Meals for Raquel Team</p>
      </div>
    </body>
    </html>
  `;
}

export function generateCancellationConfirmationEmail(
  name: string,
  mealDescription: string,
  date: string,
  location: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        h2 { color: #2563eb; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Meal Cancellation Confirmed</h2>
        <p>Hi ${name},</p>
        <p>Your meal signup has been successfully cancelled.</p>

        <div class="info-box">
          <p><strong>Cancelled Meal:</strong> ${mealDescription}</p>
          <p><strong>Date:</strong> ${formatDate(date)}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>

        <p>If you'd like to sign up for a different date, please visit our signup page.</p>

        <p>Thank you,</p>
        <p>- The Meals for Raquel Team</p>
      </div>
    </body>
    </html>
  `;
}

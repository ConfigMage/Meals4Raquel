# Implementation Guide for Claude Code

## Project Architecture

### Framework Choice: Next.js 14+ (App Router)
- Use App Router (not Pages Router)
- Server Components by default
- Server Actions for form submissions
- API routes in `/app/api/` directory

### Directory Structure
```
meal-coordination-app/
├── app/
│   ├── page.tsx                    # Home/Signup page
│   ├── meals/
│   │   └── page.tsx                # View all meals (3 columns)
│   ├── cancel/
│   │   └── [token]/
│   │       └── page.tsx            # Cancellation page
│   ├── admin/
│   │   ├── page.tsx                # Admin login
│   │   └── dashboard/
│   │       └── page.tsx            # Admin dashboard
│   ├── api/
│   │   ├── meals/
│   │   │   └── route.ts            # GET, POST meals
│   │   ├── pickup-locations/
│   │   │   └── route.ts            # GET pickup locations
│   │   ├── cancel/
│   │   │   └── [token]/
│   │   │       └── route.ts        # POST cancel
│   │   ├── admin/
│   │   │   ├── meals/
│   │   │   │   └── route.ts
│   │   │   ├── pickup-locations/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   └── couriers/
│   │   │       ├── route.ts
│   │   │       └── [id]/
│   │   │           └── route.ts
│   │   └── cron/
│   │       └── send-reminders/
│   │           └── route.ts
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Tailwind CSS
├── lib/
│   ├── db.ts                       # Database connection
│   ├── email.ts                    # Gmail API email functions
│   ├── auth.ts                     # Admin password check
│   └── utils.ts                    # Helper functions
├── components/
│   ├── MealSignupForm.tsx
│   ├── MealsList.tsx
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx
│   └── ...
├── types/
│   └── index.ts                    # TypeScript types
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── vercel.json                     # Cron configuration
```

## Key Implementation Details

### 1. Database Connection (`lib/db.ts`)

Use Neon's serverless driver for edge compatibility:

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default sql;
```

**Important**: Use parameterized queries to prevent SQL injection:
```typescript
// Good
const result = await sql`
  SELECT * FROM meal_signups WHERE id = ${id}
`;

// Bad - vulnerable to SQL injection
const result = await sql`
  SELECT * FROM meal_signups WHERE id = '${id}'
`;
```

### 2. Gmail API Email Service (`lib/email.ts`)

Use service account authentication:

```typescript
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

const auth = new google.auth.JWT(
  process.env.GMAIL_CLIENT_EMAIL,
  undefined,
  process.env.GMAIL_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/gmail.send']
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.SENDER_EMAIL,
    serviceClient: process.env.GMAIL_CLIENT_EMAIL,
    privateKey: process.env.GMAIL_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.SENDER_EMAIL,
    to,
    subject,
    html,
  });
}
```

### 3. Email Templates

Create reusable email template functions in `lib/email.ts`:

**Confirmation Email:**
```typescript
export function generateConfirmationEmail(
  name: string,
  date: string,
  location: string,
  mealDescription: string,
  freezerFriendly: boolean,
  cancellationUrl: string,
  couriers: { name: string; phone: string; email: string }[]
) {
  return `
    <h2>Thank you for coordinating a meal, ${name}!</h2>
    <p>Your meal drop-off has been confirmed:</p>
    <ul>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Location:</strong> ${location}</li>
      <li><strong>Meal:</strong> ${mealDescription}</li>
      <li><strong>Freezer Friendly:</strong> ${freezerFriendly ? 'Yes' : 'No'}</li>
    </ul>
    <p><strong>Please drop off by 2:00 PM</strong></p>
    <p>If you need to cancel, <a href="${cancellationUrl}">click here</a>.</p>
    <h3>Courier Contacts:</h3>
    ${couriers.map(c => `<p>${c.name}: ${c.phone} (${c.email})</p>`).join('')}
  `;
}
```

**Reminder Email:**
```typescript
export function generateReminderEmail(
  name: string,
  date: string,
  location: string,
  mealDescription: string,
  couriers: { name: string; phone: string }[]
) {
  // Similar structure
}
```

**Courier Summary Email:**
```typescript
export function generateCourierSummaryEmail(
  location: string,
  date: string,
  meals: Array<{
    name: string;
    phone: string;
    mealDescription: string;
    freezerFriendly: boolean;
    canBringToSalem: boolean;
    noteToCourier: string | null;
  }>
) {
  return `
    <h2>Meal Pickup Summary - ${location}</h2>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Total Meals:</strong> ${meals.length}</p>
    <hr>
    ${meals.map((meal, i) => `
      <h3>Meal ${i + 1}</h3>
      <ul>
        <li><strong>From:</strong> ${meal.name} (${meal.phone})</li>
        <li><strong>Meal:</strong> ${meal.mealDescription}</li>
        <li><strong>Freezer Friendly:</strong> ${meal.freezerFriendly ? 'Yes' : 'No'}</li>
        <li><strong>Can bring to Salem:</strong> ${meal.canBringToSalem ? 'Yes' : 'No'}</li>
        ${meal.noteToCourier ? `<li><strong>Note:</strong> ${meal.noteToCourier}</li>` : ''}
      </ul>
    `).join('<hr>')}
  `;
}
```

### 4. Admin Authentication (`lib/auth.ts`)

Simple session-based auth (no need for complex auth):

```typescript
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Meals4Raquel';

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');
  return adminSession?.value === 'authenticated';
}

export async function setAdminAuth() {
  const cookieStore = await cookies();
  cookieStore.set('admin_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}
```

### 5. Cron Job Implementation

**In `app/api/cron/send-reminders/route.ts`:**

```typescript
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendEmail, generateReminderEmail, generateCourierSummaryEmail } from '@/lib/email';
import { addDays, format } from 'date-fns';

export async function GET(request: Request) {
  // Verify Vercel Cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    
    // Get all pickup locations for tomorrow
    const pickupLocations = await sql`
      SELECT * FROM pickup_locations 
      WHERE pickup_date = ${tomorrow} AND active = true
    `;

    for (const location of pickupLocations) {
      // Get all non-cancelled meals for this location
      const meals = await sql`
        SELECT * FROM meal_signups 
        WHERE pickup_location_id = ${location.id} 
        AND cancelled_at IS NULL
      `;

      // Send reminder to each meal provider
      for (const meal of meals) {
        const couriers = await sql`
          SELECT name, phone, email FROM couriers 
          WHERE active = true AND ${location.location} = ANY(locations)
        `;
        
        await sendEmail(
          meal.email,
          `Reminder: Meal Drop-off Tomorrow - ${format(new Date(tomorrow), 'MMMM d, yyyy')}`,
          generateReminderEmail(meal.name, tomorrow, location.location, meal.meal_description, couriers)
        );
      }

      // Send summary to all couriers for this location
      const couriers = await sql`
        SELECT email FROM couriers 
        WHERE active = true AND ${location.location} = ANY(locations)
      `;
      
      const courierEmails = couriers.map(c => c.email);
      
      for (const email of courierEmails) {
        await sendEmail(
          email,
          `Meal Pickup Summary - ${location.location} - ${format(new Date(tomorrow), 'MMMM d, yyyy')}`,
          generateCourierSummaryEmail(location.location, tomorrow, meals)
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Reminders sent' });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}
```

### 6. Three-Column Layout Component

**In `components/MealsList.tsx`:**

```typescript
'use client';

import { useState, useEffect } from 'react';

interface Meal {
  id: number;
  name: string;
  meal_description: string;
  freezer_friendly: boolean;
  cancelled_at: string | null;
  pickup_date: string;
  location: string;
}

export default function MealsList() {
  const [meals, setMeals] = useState<{
    Salem: Meal[];
    Portland: Meal[];
    Eugene: Meal[];
  }>({ Salem: [], Portland: [], Eugene: [] });

  useEffect(() => {
    fetch('/api/meals')
      .then(res => res.json())
      .then(data => setMeals(data));
  }, []);

  const renderLocation = (location: 'Salem' | 'Portland' | 'Eugene') => {
    const locationMeals = meals[location];
    
    // Group by date
    const mealsByDate = locationMeals.reduce((acc, meal) => {
      if (!acc[meal.pickup_date]) {
        acc[meal.pickup_date] = [];
      }
      acc[meal.pickup_date].push(meal);
      return acc;
    }, {} as Record<string, Meal[]>);

    return (
      <div className="border rounded-lg p-4">
        <h2 className="text-2xl font-bold mb-4">{location}</h2>
        {Object.entries(mealsByDate).map(([date, meals]) => (
          <div key={date} className="mb-6">
            <h3 className="text-lg font-semibold mb-2">
              {new Date(date).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </h3>
            {meals.map(meal => (
              <div 
                key={meal.id} 
                className={`mb-3 p-3 border-l-4 ${
                  meal.cancelled_at 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-green-500 bg-green-50'
                }`}
              >
                <p className={meal.cancelled_at ? 'line-through' : ''}>
                  <strong>{meal.name}</strong>: {meal.meal_description}
                  {meal.freezer_friendly && ' ❄️'}
                </p>
                {meal.cancelled_at && (
                  <p className="text-red-600 text-sm">(Cancelled)</p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-sm">
          <strong>Important:</strong> All meals should be dropped off no later than 
          2:00 PM at the specified location. If this is not possible, please contact the courier.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderLocation('Salem')}
        {renderLocation('Portland')}
        {renderLocation('Eugene')}
      </div>
    </div>
  );
}
```

### 7. Form Submission with Server Actions

**In `app/page.tsx`:**

```typescript
import MealSignupForm from '@/components/MealSignupForm';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Meals for Raquel</h1>
      <p className="mb-8">Sign up to provide a home-cooked meal for our team member.</p>
      <MealSignupForm />
    </main>
  );
}
```

**In `components/MealSignupForm.tsx`:**

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function MealSignupForm() {
  const [pickupLocations, setPickupLocations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    pickupLocationId: '',
    mealDescription: '',
    freezerFriendly: false,
    noteToCourier: '',
    canBringToSalem: false,
  });

  useEffect(() => {
    fetch('/api/pickup-locations')
      .then(res => res.json())
      .then(data => setPickupLocations(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      alert('Meal signup successful! Check your email for confirmation.');
      // Reset form
    } else {
      alert('Error signing up. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
      {/* Form fields */}
    </form>
  );
}
```

## Testing & Development Tips

### 1. Local Gmail API Testing
Use Gmail's test mode or create a test service account to avoid spamming real emails during development.

### 2. Database Seeding
Create a seed script to populate initial data:
- Add some pickup locations
- Add the three couriers
- Optionally add test meal signups

### 3. Cron Job Testing
You can manually trigger the cron job during development:
```bash
curl http://localhost:3000/api/cron/send-reminders
```

### 4. Environment Variables
Make sure to add a `.env.example` file showing required variables (without actual values).

## Common Pitfalls to Avoid

1. **SQL Injection**: Always use parameterized queries with Neon's template literals
2. **Email Rate Limits**: Gmail has sending limits; be mindful in production
3. **Timezone Issues**: Use date-fns with proper timezone handling
4. **Cron Job Reliability**: Vercel cron is reliable but test thoroughly
5. **Error Handling**: Wrap all async operations in try-catch blocks
6. **Mobile Responsiveness**: Test the three-column layout on mobile (should stack)

## Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] Database schema created in Neon
- [ ] Gmail API credentials tested
- [ ] Cron job configured in vercel.json
- [ ] Admin password changed from default (if needed)
- [ ] Test email sending in production
- [ ] Mobile responsive design verified
- [ ] Cancellation links work with production URL

## Security Considerations

1. **Admin Password**: Stored in environment variable, checked server-side
2. **SQL Injection**: Prevented by parameterized queries
3. **Email Validation**: Basic validation on frontend and backend
4. **Cancellation Tokens**: UUIDs are cryptographically secure
5. **HTTPS**: Vercel provides this automatically
6. **Courier Notes Privacy**: Never exposed in public API endpoints

## Performance Optimizations

1. **Static Generation**: Use ISR (Incremental Static Regeneration) for meal list page
2. **Database Indexes**: Add indexes on frequently queried columns
3. **Email Queue**: Consider adding a queue for high-volume email sending
4. **Caching**: Cache pickup locations for better performance

## Future Enhancements (Out of Scope for MVP)

- SMS notifications in addition to email
- Calendar integration (.ics files)
- Photo uploads for meals
- Dietary restriction filtering
- Meal rating system
- Automated thank you emails after delivery
- Analytics dashboard

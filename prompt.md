# Meal Coordination Web Application

## Project Overview
Build a Next.js web application to help coworkers coordinate home-cooked meals for a team member (Raquel). The app allows staff to sign up to provide meals, view what others are bringing, and automatically sends email notifications to meal providers and couriers.

## Technology Stack
- **Frontend/Backend**: Next.js 14+ (App Router)
- **Database**: PostgreSQL (Neon)
- **Deployment**: Vercel
- **Email**: Gmail API
- **Styling**: Tailwind CSS

## Core Features

### 1. Public Meal Signup Form
Allow users to sign up to provide a meal with the following fields:
- Name (required)
- Phone Number (required)
- Email (required)
- Pickup Date (dropdown - only show future dates)
- Pickup Location (auto-populated based on selected date)
- Meal Description (required, textarea)
- Freezer Friendly (yes/no radio buttons)
- Note to Courier (optional, textarea) - This should ONLY be visible to couriers, never in public view
- Checkbox: "I can bring this to the Salem office" (yes/no)

### 2. Public View - Three Column Layout
Display all upcoming meal signups organized by location:
- Three columns: **Salem** | **Portland** | **Eugene**
- Under each location, group meals by date
- For each meal show:
  - Date
  - Person's name
  - Meal description
  - Freezer friendly indicator
  - If cancelled: show with strikethrough and "(Cancelled)" label
- Display message: "All meals should be dropped off no later than 2:00 PM at the specified location. If this is not possible, please contact the courier."

### 3. Admin Dashboard
Password protected (passphrase: `Meals4Raquel`)

**Features:**
- View all meal signups in a table (including cancelled ones)
- Add/Edit/Delete pickup dates and locations
- Add/Edit/Delete couriers
- See courier contact information
- Filter by location, date, or status

**Pickup Locations Management:**
- Date (date picker)
- Location (dropdown: Salem, Portland, Eugene)
- Active/Inactive toggle

**Courier Management:**
- Name
- Email
- Phone
- Location assignment (can assign multiple locations)

**Initial Courier Data:**
```
Chris Solario | solarioc@yahoo.com | 503-551-9188
Savanah Solario | Savanah.Solario@gmail.com | 503-551-9188
Molly Lajoie | Solarioc@yahoo.com | 503-551-9188
```

### 4. Cancellation Flow
- When a meal is signed up, generate a unique cancellation token (UUID)
- Include cancellation link in confirmation email: `https://[domain]/cancel/[token]`
- When clicked:
  - Soft delete: Set `cancelled_at` timestamp (do NOT hard delete)
  - Send cancellation notification to all couriers for that location
  - Display confirmation message to user
- Cancelled meals remain in database but are marked as cancelled

### 5. Email Notifications (Gmail API)

**Email 1: Confirmation to Meal Provider** (Immediate)
- Trigger: When user submits the signup form
- To: User's email
- Subject: "Meal Drop-off Confirmation - [Date]"
- Content:
  - Thank you message
  - Confirmation of their information (name, date, location, meal description, freezer friendly)
  - Drop-off deadline (2:00 PM)
  - Cancellation link
  - Contact info for couriers for that location

**Email 2: Reminder to Meal Provider** (Day before pickup)
- Trigger: Automated daily check at 9:00 AM for pickups happening tomorrow
- To: User's email
- Subject: "Reminder: Meal Drop-off Tomorrow - [Date]"
- Content:
  - Friendly reminder
  - Location address
  - Time deadline (2:00 PM)
  - What they said they're bringing
  - Contact info for couriers

**Email 3: Courier Summary** (Day before pickup)
- Trigger: Automated daily check at 9:00 AM for pickups happening tomorrow
- To: ALL couriers assigned to that location
- Subject: "Meal Pickup Summary - [Location] - [Date]"
- Content:
  - Location and date
  - List of all meals to be picked up:
    - Provider name and phone
    - Meal description
    - Freezer friendly status
    - Can bring to Salem office (yes/no)
    - **Note to courier** (if provided)
  - Total count of meals

**Email 4: Cancellation Notification** (Immediate)
- Trigger: When someone cancels their meal
- To: ALL couriers for that location
- Subject: "Meal Cancellation - [Location] - [Date]"
- Content:
  - Who cancelled
  - What date
  - Their meal description
  - Updated count of remaining meals for that date

## Database Schema

### Table: `pickup_locations`
```sql
CREATE TABLE pickup_locations (
  id SERIAL PRIMARY KEY,
  pickup_date DATE NOT NULL,
  location VARCHAR(50) NOT NULL CHECK (location IN ('Salem', 'Portland', 'Eugene')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pickup_date, location)
);
```

### Table: `meal_signups`
```sql
CREATE TABLE meal_signups (
  id SERIAL PRIMARY KEY,
  pickup_location_id INTEGER REFERENCES pickup_locations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  meal_description TEXT NOT NULL,
  freezer_friendly BOOLEAN NOT NULL,
  note_to_courier TEXT,
  can_bring_to_salem BOOLEAN NOT NULL,
  cancellation_token UUID UNIQUE DEFAULT gen_random_uuid(),
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `couriers`
```sql
CREATE TABLE couriers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  locations TEXT[] NOT NULL, -- array of locations they cover
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Routes Needed

### Public Routes
- `POST /api/meals` - Create new meal signup
- `GET /api/meals` - Get all non-cancelled meals grouped by location
- `GET /api/pickup-locations` - Get all future pickup dates/locations
- `POST /api/cancel/:token` - Cancel a meal by token

### Admin Routes (require password check)
- `GET /api/admin/meals` - Get all meals (including cancelled)
- `GET /api/admin/pickup-locations` - Get all pickup locations
- `POST /api/admin/pickup-locations` - Create pickup location
- `PUT /api/admin/pickup-locations/:id` - Update pickup location
- `DELETE /api/admin/pickup-locations/:id` - Delete pickup location
- `GET /api/admin/couriers` - Get all couriers
- `POST /api/admin/couriers` - Create courier
- `PUT /api/admin/couriers/:id` - Update courier
- `DELETE /api/admin/couriers/:id` - Delete courier

### Cron Routes (Vercel Cron)
- `GET /api/cron/send-reminders` - Run daily at 9 AM to send reminders for tomorrow's pickups

## UI/UX Requirements

### Design
- Clean, simple interface
- Mobile responsive
- Use Tailwind CSS for styling
- Professional but warm/friendly tone
- Clear call-to-action buttons

### Public Pages
1. **Home/Signup Page** (`/`)
   - Hero section explaining the purpose
   - Signup form
   - Link to view existing signups

2. **View Meals Page** (`/meals`)
   - Three column layout (Salem | Portland | Eugene)
   - Show meals grouped by date under each location
   - Show cancelled meals with strikethrough
   - Link back to signup

3. **Cancellation Page** (`/cancel/[token]`)
   - Confirm cancellation
   - Show what they're cancelling
   - Success message after cancellation

### Admin Pages
1. **Admin Login** (`/admin`)
   - Simple password form (passphrase: Meals4Raquel)
   - Store in session

2. **Admin Dashboard** (`/admin/dashboard`)
   - Tabs for: Meals | Pickup Locations | Couriers
   - Meals tab: table with filters
   - Pickup Locations tab: CRUD interface
   - Couriers tab: CRUD interface

## Gmail API Setup Instructions

The developer will need to:

1. Go to Google Cloud Console (https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in details and create
   - Click on the created service account
   - Go to "Keys" tab
   - Add Key > Create new key > JSON
   - Download the JSON file
5. Domain-wide delegation (if needed):
   - In service account details, enable domain-wide delegation
   - Note the Client ID
6. Environment variables needed:
   ```
   GMAIL_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
   GMAIL_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
   GMAIL_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com
   SENDER_EMAIL=the-email-that-sends@example.com
   ```

## Environment Variables

Create a `.env.local` file:
```
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Gmail API
GMAIL_SERVICE_ACCOUNT_EMAIL=
GMAIL_PRIVATE_KEY=
GMAIL_CLIENT_EMAIL=
SENDER_EMAIL=

# Admin
ADMIN_PASSWORD=Meals4Raquel

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment Steps

### Neon Database Setup
1. Create account at neon.tech
2. Create new project
3. Copy connection string
4. Run SQL schema to create tables
5. Add DATABASE_URL to Vercel environment variables

### Vercel Deployment
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy
5. Set up Vercel Cron:
   - Add to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/send-reminders",
       "schedule": "0 9 * * *"
     }]
   }
   ```

## Development Notes

### Email Library
Use `nodemailer` with Gmail API OAuth2:
```bash
npm install nodemailer googleapis
```

### Database Client
Use `@neondatabase/serverless` or `pg`:
```bash
npm install @neondatabase/serverless
```

### UUID Generation
Already available in PostgreSQL with `gen_random_uuid()`

### Date Handling
Use `date-fns` for date manipulation:
```bash
npm install date-fns
```

## Important Business Rules

1. **No login required** for public features
2. **Soft delete only** - never hard delete meal signups
3. **Past dates filtered** - don't show dates that have passed
4. **Courier note privacy** - Never show courier notes in public view
5. **Multi-courier emails** - Always send to ALL couriers for a location
6. **No capacity limits** - Anyone can sign up for any date
7. **Location is tied to date** - One pickup location per date

## Testing Checklist

- [ ] Can submit meal signup
- [ ] Receives confirmation email immediately
- [ ] Can view meals in three-column layout
- [ ] Can cancel via email link
- [ ] Cancelled meals show with strikethrough
- [ ] Couriers receive cancellation notification
- [ ] Admin can login with passphrase
- [ ] Admin can add/edit/delete pickup locations
- [ ] Admin can add/edit/delete couriers
- [ ] Reminder emails sent day before (test with manual trigger)
- [ ] Courier summary emails sent day before
- [ ] Past dates don't show in signup dropdown
- [ ] Mobile responsive design works
- [ ] Courier notes only visible to couriers, not in public view

## Success Criteria

The application successfully:
1. Allows coworkers to easily sign up to provide meals
2. Provides visibility into what meals are planned
3. Automatically reminds providers before their drop-off
4. Keeps couriers informed of what to pick up
5. Handles cancellations gracefully
6. Provides admin control over dates and couriers
7. Works seamlessly on mobile and desktop

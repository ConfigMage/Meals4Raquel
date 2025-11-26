# Claude Code Prompt - Meal Coordination App

## Overview
Build a complete Next.js web application for coordinating home-cooked meals. Read `prompt.md` for full specifications and `agents.md` for implementation guidance.

## Quick Summary

**What to build:**
- Public meal signup form (no login required)
- Three-column view showing meals by location (Salem | Portland | Eugene)
- Automated email system with Gmail API (confirmation, reminders, courier summaries, cancellations)
- Password-protected admin dashboard
- Vercel cron job for daily reminders

**Tech Stack:**
- Next.js 14+ (App Router)
- PostgreSQL (Neon)
- Tailwind CSS
- Gmail API (nodemailer + googleapis)
- Vercel deployment

## Getting Started

### 1. Review Documentation
Read these files in order:
1. `prompt.md` - Complete project requirements
2. `agents.md` - Implementation details and architecture
3. `schema.sql` - Database schema

### 2. Create Next.js App

```bash
# Initialize Next.js with TypeScript and Tailwind
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Install additional dependencies
npm install @neondatabase/serverless nodemailer googleapis date-fns uuid
npm install -D @types/nodemailer @types/uuid
```

### 3. Key Files to Create

**Database Layer** (`lib/db.ts`):
```typescript
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
export default sql;
```

**Email Service** (`lib/email.ts`):
- Set up Gmail API with service account
- Create email template functions:
  - `generateConfirmationEmail()`
  - `generateReminderEmail()`
  - `generateCourierSummaryEmail()`
  - `generateCancellationEmail()`
- Export `sendEmail()` function

**Auth Helper** (`lib/auth.ts`):
- Session-based admin authentication
- Password check function
- Cookie management

### 4. Pages to Build

1. **`app/page.tsx`** - Home/signup form
2. **`app/meals/page.tsx`** - Three-column meal view
3. **`app/cancel/[token]/page.tsx`** - Cancellation page
4. **`app/admin/page.tsx`** - Admin login
5. **`app/admin/dashboard/page.tsx`** - Admin dashboard with tabs

### 5. API Routes to Build

**Public Routes:**
- `POST /api/meals` - Create meal signup
- `GET /api/meals` - Get all meals (grouped by location)
- `GET /api/pickup-locations` - Get future pickup dates
- `POST /api/cancel/[token]` - Cancel a meal

**Admin Routes:**
- All CRUD operations for meals, pickup_locations, couriers
- Protect with admin password check

**Cron Route:**
- `GET /api/cron/send-reminders` - Send daily reminders at 9 AM

### 6. Components to Create

- `MealSignupForm.tsx` - Signup form with validation
- `MealsList.tsx` - Three-column layout component
- `AdminLogin.tsx` - Password form
- `AdminDashboard.tsx` - Tabs for meals/locations/couriers
- Various smaller components as needed

## Critical Requirements

### Database
- ✅ Use soft deletes (cancelled_at timestamp)
- ✅ Always use parameterized queries
- ✅ Generate UUID cancellation tokens
- ✅ Filter out past dates in public views

### Emails
- ✅ Send confirmation immediately after signup
- ✅ Include cancellation link in confirmation
- ✅ Send reminders at 9 AM for tomorrow's pickups
- ✅ Send courier summary with ALL meals for their location
- ✅ Send cancellation notification to ALL couriers
- ✅ Never show "note_to_courier" in public view

### UI/UX
- ✅ Three-column layout: Salem | Portland | Eugene
- ✅ Show cancelled meals with strikethrough
- ✅ Mobile responsive
- ✅ Display message about 2 PM drop-off deadline
- ✅ Clean, simple forms

### Security
- ✅ Admin password in environment variable
- ✅ No SQL injection (use parameterized queries)
- ✅ Secure UUID tokens for cancellation
- ✅ Email validation

## Environment Variables Needed

```env
DATABASE_URL=postgresql://...
GMAIL_SERVICE_ACCOUNT_EMAIL=...
GMAIL_CLIENT_EMAIL=...
GMAIL_PRIVATE_KEY=...
SENDER_EMAIL=...
ADMIN_PASSWORD=Meals4Raquel
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=... (optional)
```

## Testing Checklist

After building:
- [ ] Run database schema in Neon
- [ ] Set up Gmail API and get credentials
- [ ] Add environment variables
- [ ] Test signup form → receive email
- [ ] Test cancellation link
- [ ] Test admin dashboard login
- [ ] Verify three-column layout works
- [ ] Test cron job manually
- [ ] Deploy to Vercel

## Important Notes

1. **Soft Delete Only**: Never hard delete meal_signups
2. **Courier Privacy**: note_to_courier only in emails, never public
3. **Multi-Courier**: ALL couriers for a location get emails
4. **Date Filtering**: Only show future dates in signup
5. **No Capacity Limits**: Anyone can sign up for any date
6. **Password**: Default is "Meals4Raquel" (can be changed)

## Files Structure

```
app/
├── page.tsx
├── meals/page.tsx
├── cancel/[token]/page.tsx
├── admin/
│   ├── page.tsx
│   └── dashboard/page.tsx
├── api/
│   ├── meals/route.ts
│   ├── pickup-locations/route.ts
│   ├── cancel/[token]/route.ts
│   ├── admin/
│   │   ├── meals/route.ts
│   │   ├── pickup-locations/route.ts & [id]/route.ts
│   │   └── couriers/route.ts & [id]/route.ts
│   └── cron/send-reminders/route.ts
├── layout.tsx
└── globals.css

lib/
├── db.ts
├── email.ts
├── auth.ts
└── utils.ts

components/
├── MealSignupForm.tsx
├── MealsList.tsx
├── AdminLogin.tsx
└── AdminDashboard.tsx
```

## Vercel Configuration

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/send-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

## Success Criteria

App is complete when:
1. Users can sign up for meals without login
2. Confirmation emails send immediately
3. Three-column view shows all meals by location
4. Cancelled meals show with strikethrough
5. Admin can manage dates, locations, and couriers
6. Cron job sends reminders at 9 AM
7. Couriers receive summaries and cancellation notices
8. Mobile responsive and looks good

## Additional Resources

- Full specs: `prompt.md`
- Implementation guide: `agents.md`
- Database setup: `schema.sql`
- Setup instructions: `QUICKSTART.md`
- Gmail setup: `GMAIL_API_SETUP.md`

## Start Coding!

Begin with:
1. Set up Next.js project structure
2. Create database connection (`lib/db.ts`)
3. Build signup form and API endpoint
4. Add email service
5. Create three-column view
6. Build admin dashboard
7. Add cron job
8. Test everything
9. Deploy to Vercel

Good luck! 🚀

# Gmail API Setup Walkthrough

This guide walks you through setting up Gmail API with a service account to send emails from the Meals for Raquel app.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- A Gmail account that will be used to send emails

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page
3. Click **"New Project"**
4. Enter project details:
   - **Project name:** `Meals4Raquel` (or any name you prefer)
   - **Organization:** Leave as default or select your organization
5. Click **"Create"**
6. Wait for the project to be created, then select it from the project dropdown

---

## Step 2: Enable the Gmail API

1. In your Google Cloud project, go to **APIs & Services** > **Library**
   - Or use this direct link: [API Library](https://console.cloud.google.com/apis/library)
2. Search for **"Gmail API"**
3. Click on **Gmail API** in the results
4. Click **"Enable"**
5. Wait for the API to be enabled

---

## Step 3: Create a Service Account

1. Go to **APIs & Services** > **Credentials**
   - Or use: [Credentials Page](https://console.cloud.google.com/apis/credentials)
2. Click **"+ Create Credentials"** at the top
3. Select **"Service account"**
4. Fill in the service account details:
   - **Service account name:** `meals-email-sender`
   - **Service account ID:** Will auto-fill based on name
   - **Description:** `Service account for sending meal coordination emails`
5. Click **"Create and Continue"**
6. For "Grant this service account access to project":
   - Skip this step (click **"Continue"**)
7. For "Grant users access to this service account":
   - Skip this step (click **"Done"**)

---

## Step 4: Create Service Account Key

1. On the Credentials page, find your new service account in the **"Service Accounts"** section
2. Click on the service account email (e.g., `meals-email-sender@your-project.iam.gserviceaccount.com`)
3. Go to the **"Keys"** tab
4. Click **"Add Key"** > **"Create new key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. A JSON file will download automatically - **save this file securely!**

The JSON file contains your credentials and looks like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "meals-email-sender@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

---

## Step 5: Enable Domain-Wide Delegation (Required for Gmail)

Since Gmail API requires sending as a specific user, you need domain-wide delegation:

### Option A: For Google Workspace (Business/Organization accounts)

1. Go back to the service account details page
2. Click **"Show Advanced Settings"** or scroll down
3. Find **"Domain-wide delegation"** section
4. Check **"Enable Google Workspace Domain-wide Delegation"**
5. Click **"Save"**
6. Note the **Client ID** (a long number like `123456789012345678901`)

Then, in Google Workspace Admin:
1. Go to [Google Workspace Admin Console](https://admin.google.com/)
2. Navigate to **Security** > **API Controls** > **Domain-wide Delegation**
3. Click **"Add new"**
4. Enter:
   - **Client ID:** The Client ID from your service account
   - **OAuth Scopes:** `https://www.googleapis.com/auth/gmail.send`
5. Click **"Authorize"**

### Option B: For Personal Gmail Accounts (Alternative Approach)

If you're using a personal Gmail account (not Google Workspace), the service account approach is more complex. Consider these alternatives:

**Alternative 1: Use OAuth2 with refresh token**
- More setup but works with personal accounts
- Requires initial manual authorization

**Alternative 2: Use Gmail App Password**
- Simpler setup for personal accounts
- See "Alternative: App Password Setup" section below

---

## Step 6: Extract Credentials for Vercel

From your downloaded JSON file, you need these values:

| JSON Field | Vercel Environment Variable |
|------------|----------------------------|
| `client_email` | `GMAIL_CLIENT_EMAIL` |
| `private_key` | `GMAIL_PRIVATE_KEY` |

### Formatting the Private Key

The `private_key` value needs special handling:

1. Open the JSON file
2. Find the `private_key` field
3. Copy the entire value including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
4. In Vercel, paste it exactly as-is (Vercel handles the `\n` characters)

**Example:**
```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
...many lines of characters...
...xyzABC123==
-----END PRIVATE KEY-----
```

---

## Step 7: Add Environment Variables in Vercel

1. Go to your Vercel project
2. Navigate to **Settings** > **Environment Variables**
3. Add these variables:

| Name | Value |
|------|-------|
| `GMAIL_CLIENT_EMAIL` | `meals-email-sender@your-project.iam.gserviceaccount.com` |
| `GMAIL_PRIVATE_KEY` | Your full private key (including BEGIN/END lines) |
| `SENDER_EMAIL` | The Gmail address you want to send FROM |

4. Click **"Save"** for each variable
5. Redeploy your application

---

## Alternative: App Password Setup (Simpler for Personal Gmail)

If you have a personal Gmail account and the service account approach is too complex:

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled

### Step 2: Create an App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: **"Mail"**
3. Select device: **"Other (Custom name)"**
4. Enter name: `Meals4Raquel`
5. Click **"Generate"**
6. Copy the 16-character password shown

### Step 3: Update the Email Code

If using App Password, the email configuration is simpler. You would need to modify `lib/email.ts`:

```typescript
// Simpler App Password approach
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: `"Meals for Raquel" <${process.env.SENDER_EMAIL}>`,
    to,
    subject,
    html,
  });
}
```

Then add to Vercel:
- `SENDER_EMAIL`: Your Gmail address
- `GMAIL_APP_PASSWORD`: The 16-character app password

---

## Testing Your Setup

### Test Locally

1. Create `.env.local` with your credentials:
```
GMAIL_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GMAIL_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SENDER_EMAIL=your-gmail@gmail.com
```

2. Run the development server:
```bash
npm run dev
```

3. Submit a test meal signup and check if the confirmation email arrives

### Test in Production

1. After deploying to Vercel with environment variables
2. Go to your live site
3. Submit a test meal signup
4. Check the email inbox for confirmation

---

## Troubleshooting

### "unauthorized_client" Error
- Make sure domain-wide delegation is enabled
- Verify the Client ID is correctly added in Google Workspace Admin
- Check that the OAuth scope `https://www.googleapis.com/auth/gmail.send` is authorized

### "invalid_grant" Error
- The service account may not have permission to impersonate the sender email
- For personal Gmail, use the App Password approach instead

### Emails Not Sending
- Check Vercel function logs for errors
- Verify all environment variables are set correctly
- Make sure the Gmail API is enabled in Google Cloud Console

### Private Key Format Issues
- Don't modify the private key - paste it exactly as-is
- Make sure the entire key is included (BEGIN to END lines)
- In `.env.local`, wrap the key in quotes

---

## Security Notes

1. **Never commit credentials** - The `.gitignore` already excludes `.env.local`
2. **Rotate keys periodically** - Create new service account keys every few months
3. **Limit API scope** - Only the `gmail.send` scope is needed, don't add more
4. **Monitor usage** - Check Google Cloud Console for unusual API activity

---

## Quick Reference

### Environment Variables Needed

```env
# For Service Account approach
GMAIL_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GMAIL_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SENDER_EMAIL=your-sending-email@gmail.com

# For App Password approach (alternative)
SENDER_EMAIL=your-gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google Workspace Admin](https://admin.google.com/)
- [App Passwords](https://myaccount.google.com/apppasswords)

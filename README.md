# Finance Tracker

A full-stack financial analysis and spending tracker built with Next.js, MongoDB, and NextAuth.js.

## Features

- **Google OAuth + Email/Password Login** — Sign in with Google on first visit, then use either Google or email/password
- **Add Debit/Credit Transactions** — Log debits with categories or credits with source info
- **Check Balance** — View overall and per-account balances with monthly spending summaries
- **Spending Analysis** — Category-wise breakdown with interactive pie chart
- **Deposit Accounts** — Create and manage multiple deposit accounts

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **NextAuth.js v5** (Google OAuth + Credentials)
- **MongoDB Atlas** + Mongoose
- **Recharts** (pie charts)

## Prerequisites

1. **Node.js** 18+ installed
2. **MongoDB Atlas** free cluster — [Create one here](https://www.mongodb.com/atlas)
3. **Google OAuth credentials** — [Google Cloud Console](https://console.cloud.google.com)

## Setup

### 1. Clone and install

```bash
cd "Finance App"
npm install
```

### 2. Set up MongoDB Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free M0 cluster
2. Create a database user with a password
3. Add your IP to the Network Access whitelist (or allow `0.0.0.0/0` for Vercel)
4. Click **Connect > Drivers** and copy the connection string

### 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Set application type to **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://your-domain.vercel.app/api/auth/callback/google` (for production)
7. Copy the Client ID and Client Secret

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:

- `MONGODB_URI` — your MongoDB Atlas connection string
- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for dev

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and click **Import Project**
3. Connect your GitHub repo
4. Add all environment variables from `.env.local` in the Vercel dashboard
   - Update `NEXTAUTH_URL` to your Vercel deployment URL
   - Add your Vercel URL to Google OAuth authorized redirect URIs
5. Click **Deploy** — Vercel auto-detects Next.js and builds it

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # Auth endpoints
│   │   ├── accounts/route.ts             # Deposit account CRUD
│   │   ├── transactions/route.ts         # Transaction CRUD
│   │   ├── balance/route.ts              # Balance summary
│   │   ├── analysis/route.ts             # Spending analysis
│   │   └── complete-profile/route.ts     # Profile setup
│   ├── complete-profile/page.tsx         # Profile setup page
│   ├── dashboard/page.tsx                # Main dashboard
│   ├── layout.tsx                        # Root layout
│   └── page.tsx                          # Login page
├── components/
│   ├── CheckBalance.tsx                  # Balance display
│   ├── CreateAccount.tsx                 # New account form
│   ├── DashboardBox.tsx                  # Colored box component
│   ├── DebitCreditForm.tsx               # Transaction form
│   ├── LoginForm.tsx                     # Login form
│   ├── SessionProvider.tsx               # Auth session wrapper
│   └── SpendingAnalysis.tsx              # Pie chart + breakdown
├── lib/
│   ├── auth.ts                           # NextAuth configuration
│   └── mongodb.ts                        # DB connection
├── models/
│   ├── DepositAccount.ts                 # Account model
│   ├── Transaction.ts                    # Transaction model
│   └── User.ts                           # User model
└── types/
    └── next-auth.d.ts                    # Type augmentation
```

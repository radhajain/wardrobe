# Wardrobe

A personal wardrobe management app for cataloging your clothes and creating outfits.
<img width="2830" height="1534" alt="CleanShot 2026-01-16 at 11 06 15@2x" src="https://github.com/user-attachments/assets/bc62c05a-ee7f-4130-8584-aa33bae7aae4" />
<img width="2828" height="1538" alt="CleanShot 2026-01-16 at 11 07 51@2x" src="https://github.com/user-attachments/assets/c4f23f0e-0ecc-4aae-9164-33ef48a41b29" />
<img width="2604" height="1522" alt="CleanShot 2026-01-16 at 11 11 30@2x" src="https://github.com/user-attachments/assets/648b8093-cd57-4ce7-a5a7-bb4ba671af1a" />
<img width="2588" height="1500" alt="CleanShot 2026-01-16 at 11 15 05@2x" src="https://github.com/user-attachments/assets/9e987205-f0c8-40db-bb4d-ec1a7878ada0" />
<img width="2604" height="1534" alt="CleanShot 2026-01-16 at 11 15 27@2x" src="https://github.com/user-attachments/assets/f99ac65a-10e0-459a-b08a-0f91fc7453d1" />

## What it does

**Pieces** - Keep track of everything in your wardrobe. Add items by pasting a product URL (the app will try to pull in details automatically) or enter them manually. Click any piece to see its details, edit the description, and see which outfits it's part of.

**Outfits** - Browse the outfit collages you've created.

**Builder** - Drag and drop pieces from your wardrobe onto a canvas to create outfit collages. Resize and arrange items however you want.

**Stylist** - Chat with an AI style assistant that knows your wardrobe. Ask for outfit suggestions, get advice on what to wear, or just talk through styling ideas. The assistant remembers your preferences over time.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Frontend:** React 19 + React Router v7
- **Database:** Neon PostgreSQL + Drizzle ORM
- **Auth:** Neon Auth
- **Storage:** Vercel Blob
- **AI:** Google Gemini
- **Deployment:** Vercel

## Setup

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) account (for PostgreSQL database + auth)
- A [Vercel](https://vercel.com) account (for blob storage)
- A [Google AI Studio](https://aistudio.google.com) account (for Gemini API)

### Installation

1. Clone the repository and install dependencies:

   ```bash
   git clone <repo-url>
   cd wardrobe
   npm install
   ```

2. Create a `.env.local` file with the following variables:

   ```bash
   # Database (from Neon dashboard)
   DATABASE_URL="postgresql://..."
   DATABASE_URL_UNPOOLED="postgresql://..."

   # Auth (from Neon Auth setup)
   NEXT_PUBLIC_NEON_AUTH_URL="https://..."

   # Storage (from Vercel dashboard)
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

   # AI (from Google AI Studio)
   GEMINI_API_KEY="..."
   ```

3. Push the database schema:

   ```bash
   npm run db:push
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (runs migrations first)
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Run database migrations

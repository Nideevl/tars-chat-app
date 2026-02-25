# TarsChat

A real-time messaging app built for the Tars Full Stack Engineer Internship Challenge.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Convex** (backend, database, real-time)
- **Clerk** (authentication)
- **Tailwind CSS**

## Features

- Google OAuth and email/password authentication
- Real-time one-on-one and group messaging
- Typing indicators
- Online/offline presence
- Read receipts (Sent → Seen)
- Unread message badges
- Message reactions (5 emojis, one per person)
- Reply to messages
- Soft delete (delete for me / delete for everyone)
- Smart auto-scroll with jump-to-bottom button
- Resizable sidebar
- Responsive layout (mobile + desktop)
- Profile setup with avatar upload and crop
- Group chat with custom name and avatar

## Running Locally
```bash
npm install
npx convex dev
npm run dev
```

## Environment Variables
```
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
```

## AI Tools Used

Claude (claude.ai), Cursor
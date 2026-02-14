# Smart Bookmark App

A real-time bookmark management application built with Next.js 15, Supabase, and TypeScript. Features cross-tab/cross-device synchronization using Supabase Realtime Broadcast for instant updates across all user sessions.

## Features

- 🔐 **Google OAuth Authentication** via Supabase Auth
- 📌 **Bookmark Management** - Add, view, and delete bookmarks
- ⚡ **Real-Time Sync** - Instant updates across multiple tabs and devices
- 🎨 **Modern UI** - Built with Tailwind CSS and Lucide icons
- 🔒 **Secure** - Row Level Security (RLS) ensures users only see their own bookmarks

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database & Auth**: Supabase (PostgreSQL + Auth + Realtime)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- Google OAuth credentials (configured in Supabase)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd smart-bookmark-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Problems & Solutions

### Problem 1: Duplicate Bookmarks from Parallel Real-Time Mechanisms

**Issue**: Initially implemented two parallel real-time mechanisms:

- `postgres_changes` (listening to database INSERT/DELETE events)
- `broadcast` (user-specific channel messages)

Both listeners could add the same bookmark when they fired simultaneously, causing:

- Duplicate entries in the React state
- React errors about duplicate keys
- Poor user experience

**Root Cause**:

- `postgres_changes` events can be delayed or delivered multiple times in certain network conditions
- Race conditions between the two mechanisms
- Stale closures in React state setters prevented duplicate detection

**Solution**:
Switched to a **broadcast-only approach**:

- Server actions (`addBookmark`, `deleteBookmark`) broadcast to user-specific channels (`user-bookmarks-${userId}`)
- Completely removed `postgres_changes` listeners
- Broadcast happens AFTER successful database operations
- Added duplicate prevention logic in the broadcast listener:
  ```typescript
  setBookmarks((prev) => {
    if (prev.some((b) => b.id === newBookmark.id)) return prev;
    return [newBookmark, ...prev];
  });
  ```

### Problem 2: Unreliable Broadcast Message Delivery

**Issue**: Broadcasts from server actions weren't being delivered reliably in production.

**Root Cause**:
Sending messages to a Supabase channel without subscribing first can cause messages to be lost.

**Solution**:
Added `await broadcastChannel.subscribe()` before sending messages:

```typescript
const broadcastChannel = supabase.channel(`user-bookmarks-${userId}`);
await broadcastChannel.subscribe();
await broadcastChannel.send({
  type: "broadcast",
  event: "bookmark_added",
  payload: { bookmark: data },
});
await broadcastChannel.unsubscribe();
```

### Problem 3: Poor UX on Delete Operations

**Issue**: Optimistic delete (immediately removing bookmark from UI) created a jarring experience when the delete operation failed - the bookmark would vanish and then reappear.

**Solution**:

- Keep bookmark visible during deletion with visual feedback
- Show loading spinner on the delete button
- Reduce opacity and disable interaction (`opacity-50`, `pointer-events-none`)
- Let the broadcast listener remove the bookmark only after successful deletion
- If deletion fails, bookmark stays visible with error alert

```typescript
const handleDelete = async (id: string) => {
  setDeletingId(id); // Shows loading state
  try {
    await deleteBookmark(id);
    // Broadcast handles removal
  } catch (error) {
    // Bookmark stays visible, error shown
  } finally {
    setDeletingId(null);
  }
};
```

### Problem 4: Missed Events During Tab Inactivity

**Issue**: Users switching tabs or having the browser in the background might miss real-time events.

**Solution**:
Added visibility change listener to refetch bookmarks when user returns:

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      // Refetch all bookmarks
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);
}, [userId]);
```

## Architecture

### Real-Time Sync Flow

1. **User adds bookmark**:
   - Client calls `addBookmark()` server action
   - Server inserts into database and returns the bookmark
   - Server broadcasts to `user-bookmarks-${userId}` channel
   - All client tabs (including other browsers/devices) receive broadcast
   - Optimistic update in the active tab, broadcast update in other tabs

2. **User deletes bookmark**:
   - Client calls `deleteBookmark()` server action
   - Server deletes from database
   - Server broadcasts deletion event
   - All client tabs remove the bookmark from state

### Security

- Row Level Security (RLS) policies ensure users only access their own bookmarks
- User-specific broadcast channels (`user-bookmarks-${userId}`) for privacy
- Server-side authentication checks in all server actions

## Project Structure

```
smart-bookmark-app/
├── app/
│   ├── actions/
│   │   └── bookmarks.ts          # Server actions for CRUD operations
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # OAuth callback handler
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/
│   ├── AddBookmarkModal.tsx      # Modal for adding bookmarks
│   ├── BookmarksList.tsx         # Bookmark list with real-time sync
│   ├── DashboardView.tsx         # Dashboard container
│   ├── GoogleSignIn.tsx          # Google sign-in button
│   └── SignOutButton.tsx         # Sign-out button
├── utils/
│   └── supabase/
│       ├── client.ts             # Client-side Supabase client
│       ├── server.ts             # Server-side Supabase client
│       └── middleware.ts         # Auth middleware
└── types/
    └── index.ts                  # TypeScript type definitions
```

### Supabase Setup

1. Enable Realtime for the `bookmarks` table
2. Enable Broadcast in Realtime settings
3. Set up Row Level Security policies
4. Configure Google OAuth provider

## Testing

Cross-tab/cross-device sync has been tested with:

- Multiple tabs in the same browser
- Different browsers (Chrome, Edge, Firefox)
- Different devices with the same account

# PWA & Push Notifications Setup Guide

This app is configured as a Progressive Web App (PWA) with push notification support for iOS 16.4+ and other modern browsers.

## Features

- ✅ Installable PWA (can be added to iOS home screen)
- ✅ Push notifications for all activity types
- ✅ Offline support via service worker
- ✅ iOS 16.4+ compatible

## Setup Instructions

### 1. Generate VAPID Keys

VAPID keys are required for push notifications. Generate them using:

```bash
node scripts/generate-vapid-keys.js
```

This will output keys that you need to add to your environment variables.

### 2. Environment Variables

Add the following to your `.env` file:

```env
# VAPID keys for push notifications
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=mailto:notifications@yourdomain.com
```

Add to your `.env.local` file (for client-side):

```env
# Public VAPID key (safe to expose to client)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
```

### 3. Run Database Migration

```bash
npm run prisma:deploy
```

This will create the `PushSubscription` table in your database.

### 4. Deploy Requirements

**Important for iOS Push Notifications:**

- ✅ Must be served over **HTTPS** (required for service workers and push notifications)
- ✅ iOS 16.4+ required for web push on iOS
- ✅ Users must install the PWA to their home screen for push notifications to work on iOS

### 5. Testing Push Notifications

1. **Enable notifications in the app:**
   - Users can enable push notifications via the `PushNotificationSettings` component
   - Or add it to a settings page

2. **Test on iOS:**
   - Open the app in Safari on iOS 16.4+
   - Tap the Share button
   - Select "Add to Home Screen"
   - Open the app from the home screen
   - Enable push notifications when prompted

3. **Test on other browsers:**
   - Chrome/Edge: Works automatically
   - Firefox: Works automatically
   - Safari (macOS): Works automatically

## How It Works

1. **Service Worker** (`/public/sw.js`): Handles push notifications and offline caching
2. **Push Subscription**: Stored in database when user enables notifications
3. **Activity Integration**: Push notifications are automatically sent when activities are created (likes, comments, follows, etc.)
4. **Notification Click**: Opens the relevant page in the app

## Notification Types

The app sends push notifications for:
- Post likes
- Comments on posts
- Replies to comments
- Comment/reply likes
- New followers
- Mentions in posts/comments/replies

## Troubleshooting

### Notifications not working on iOS?

1. Make sure you're using iOS 16.4 or later
2. Make sure the app is installed to the home screen (not just opened in Safari)
3. Check that notifications are enabled in iOS Settings > [App Name] > Notifications
4. Make sure the site is served over HTTPS

### Service Worker not registering?

1. Check browser console for errors
2. Make sure you're on HTTPS (or localhost for development)
3. Check that `/sw.js` is accessible

### Push notifications not sending?

1. Verify VAPID keys are set correctly
2. Check server logs for errors
3. Verify the user has push subscriptions in the database
4. Make sure `web-push` package is installed

## Files Created

- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker
- `src/lib/push/` - Push notification utilities
- `src/hooks/usePushNotifications.ts` - React hook for push notifications
- `src/components/PushNotificationSettings.tsx` - UI component for enabling notifications
- `prisma/schema.prisma` - Added `PushSubscription` model


# Testing Room Deletion Timer

## How to Test the 2-Minute Room Deletion Feature

### Method 1: Using Multiple Browser Tabs/Windows

1. **Open the room in two different tabs or browsers:**
   - Tab 1: Open `http://localhost:3000/[roomId]` (or your dev URL)
   - Tab 2: Open the same room URL in a different browser/incognito window
   - Use different names for each (e.g., "User1" and "User2")

2. **Verify both users are online:**
   - Click the "Active Users" button in both tabs
   - You should see 2 active users

3. **Leave from one tab:**
   - Close Tab 2 (or navigate away)
   - In Tab 1, click "Active Users" again
   - You should see 1 active user

4. **Leave from the remaining tab:**
   - Close Tab 1 or navigate to home page
   - Wait a moment for Firebase to detect the disconnect

5. **Rejoin the room:**
   - Open the room URL again in a new tab
   - You should see the deletion timer appear near the "Active Users" button
   - Timer should show: "Room deleting in 2:00" (counting down)

6. **Test cancellation:**
   - Click the stop button (⏹) next to the timer
   - Timer should disappear
   - Room should remain active

7. **Test auto-deletion:**
   - Leave the room again (close all tabs)
   - Wait for everyone to leave
   - Rejoin the room
   - **Don't click stop** - let the timer count down
   - After 2 minutes, the room should be deleted
   - You should be redirected to the home page

### Method 2: Using Browser DevTools (Easier)

1. **Open the room in one tab**

2. **Open Browser DevTools:**
   - Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Go to the "Application" or "Storage" tab
   - Find "Local Storage" → your domain

3. **Simulate user leaving:**
   - In DevTools Console, run:
   ```javascript
   // This simulates disconnecting from Firebase
   window.location.href = '/';
   ```
   - Or simply close the tab

4. **Rejoin quickly:**
   - Open the same room URL
   - Timer should appear

### Method 3: Quick Test (Recommended)

**Fastest way to test:**

1. **Open room in one browser tab**
2. **Open same room in incognito/private window** (different name)
3. **Close the incognito window**
4. **In the main tab, open DevTools Console** (`F12`)
5. **Manually trigger empty users:**
   ```javascript
   // In console, manually set online users to empty
   // This simulates everyone leaving
   ```
   
   Actually, easier: Just close the main tab too, then reopen the room URL.

6. **Reopen the room URL**
7. **You should see the timer!**

### What to Look For

✅ **Timer appears** when you rejoin an empty room  
✅ **Timer shows countdown** in MM:SS format (e.g., "1:45", "0:30")  
✅ **Timer is red** with pulsing animation  
✅ **Stop button works** - clicking it cancels deletion  
✅ **Timer disappears** when cancelled  
✅ **Room deletes** after 2 minutes if not cancelled  
✅ **Redirects to home** after deletion  

### Troubleshooting

**Timer doesn't appear?**
- Make sure all users actually left (check Firebase Console)
- Wait a few seconds for Firebase to sync
- Refresh the page

**Timer shows wrong time?**
- Check browser console for errors
- Verify Firebase connection is working

**Room doesn't delete?**
- Check Firebase Console → Realtime Database → rooms → [roomId]
- Verify the room data is actually being deleted
- Check browser console for errors

### Firebase Console Check

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Realtime Database**
4. Navigate to `rooms/[roomId]`
5. You should see:
   - `onlineUsers` - should be empty `{}`
   - `deletionTimer` - should show a timestamp (milliseconds)
6. When timer expires, the entire `rooms/[roomId]` should be deleted

### Quick Test Script

Open browser console and run:
```javascript
// Check current online users
console.log('Online users:', /* check in Firebase or UI */);

// Check deletion timer
// Look for the timer in the UI near "Active Users" button
```

Happy testing! 🧪


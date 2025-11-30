# Whis - Real-Time Chat Application

Whis is a modern, real-time chat application built with Next.js and Firebase. Create rooms, invite friends, and chat instantly with a beautiful, responsive interface.

![Whis Chat](https://img.shields.io/badge/Next.js-15.1.5-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-9.23.0-orange?style=flat-square&logo=firebase)

## ✨ Features

### Core Features
- **Real-Time Messaging** - Instant message delivery using Firebase Realtime Database
- **Room System** - Create or join chat rooms with unique room IDs
- **User Presence** - See who's online in real-time
- **Typing Indicators** - Know when someone is typing
- **Markdown Support** - Format messages with Markdown and syntax highlighting
- **Emoji Reactions** - React to messages with quick emoji reactions (😊 😢 😠 😂 ❤️ 👍)
- **Image Sharing** - Share images directly in chat (Base64 encoding, no external storage required)
- **Message Actions** - Edit, delete, copy, and react to your messages
- **Search Messages** - Search through message history
- **Auto Room Deletion** - Rooms automatically delete 2 minutes after everyone leaves (with manual cancellation option)
- **Mobile Responsive** - Fully optimized for mobile devices with touch-friendly UI

### User Experience
- **Beautiful UI** - Modern, dark-themed interface with smooth animations
- **Context Menus** - Right-click (or long-press on mobile) messages for quick actions
- **Scroll to Bottom** - Auto-scroll to new messages with manual scroll detection
- **User Colors** - Each user gets a unique color for easy identification
- **Copy to Clipboard** - One-click message copying
- **Emoji Picker** - Full emoji picker for expressive messages

## 🚀 Tech Stack

- **Framework**: Next.js 15.1.5 (App Router + Pages Router hybrid)
- **UI Library**: React 19.0.0
- **Styling**: Tailwind CSS 3.4.1
- **Backend**: Firebase Realtime Database
- **Icons**: React Icons
- **Markdown**: react-markdown with remark-gfm and rehype-highlight
- **Emoji**: emoji-picker-react

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm
- A Firebase project with Realtime Database enabled

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Whis-V2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory and add your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

   **Optional**: For external image hosting (ImgBB):
   ```env
   NEXT_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key
   ```

4. **Configure Firebase Realtime Database**
   
   - Go to Firebase Console → Realtime Database
   - Create a database (start in test mode for development)
   - Update your security rules:
   ```json
   {
     "rules": {
       "rooms": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Getting Started

1. **Enter Your Name**
   - Enter a name (minimum 3 characters)
   - Click "Continue" or press Enter

2. **Create or Join a Room**
   - **Create Room**: Click "Create Room" to generate a unique room ID
   - **Join Room**: Enter an existing room ID and click "Join Room"

3. **Start Chatting**
   - Type your message and press Enter or click Send
   - Use the emoji button to add emojis
   - Click the "+" button to share images
   - Right-click (or long-press on mobile) messages for actions

### Message Actions

- **React**: Right-click a message → Select "Reaction" → Choose an emoji
- **Copy**: Right-click a message → Select "Copy"
- **Edit**: Right-click your own message → Select "Edit" → Modify and save
- **Delete**: Right-click your own message → Select "Delete"

### Room Features

- **Active Users**: Click the "Active Users" button to see who's online
- **Search**: Click the search icon to search through messages
- **Room Deletion Timer**: When everyone leaves, a 2-minute countdown starts. Click "Stop" to cancel deletion.

## 📁 Project Structure

```
Whis-V2/
├── app/
│   ├── page.js          # Landing page (name entry, room creation/join)
│   ├── layout.js        # Root layout
│   └── globals.css      # Global styles
├── pages/
│   ├── [roomId].js      # Chat room page
│   └── _app.js          # Custom App component
├── components/
│   ├── MessageInput.js  # Message input component
│   └── MessageList.js   # Message list and rendering
├── lib/
│   ├── firebase.js      # Firebase configuration
│   └── auth.js          # Authentication utilities
└── public/              # Static assets
```

## 🎨 Features in Detail

### Real-Time Synchronization
All messages, typing indicators, and user presence are synchronized in real-time using Firebase Realtime Database listeners.

### Image Sharing
Images are converted to Base64 and stored directly in the database. Optionally, you can use ImgBB API for external hosting by providing an API key.

### Markdown Rendering
Messages support full Markdown syntax including:
- **Bold**, *italic*, ~~strikethrough~~
- Code blocks with syntax highlighting
- Links, lists, and more

### Mobile Optimization
- Touch-friendly context menus with horizontal scrolling
- Responsive design for all screen sizes
- Long-press support for mobile interactions
- Smooth scrolling and animations

### Auto Room Deletion
When all users leave a room, a 2-minute deletion timer starts. Any user can:
- View the countdown timer
- Cancel the deletion by clicking "Stop"
- The room is automatically deleted if the timer reaches zero

## 🔒 Security Notes

- Update Firebase security rules for production
- Consider implementing user authentication for better security
- Validate and sanitize user inputs
- Set appropriate database rules based on your use case

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Firebase for real-time database services
- Next.js team for the amazing framework
- All open-source contributors




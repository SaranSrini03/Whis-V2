import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { database, ref, push, onValue, set, remove, onDisconnect } from "../lib/firebase";
import "tailwindcss/tailwind.css";
import MessageInput from "../components/MessageInput";
import MessageList from "../components/MessageList";
import { FaSearch, FaTimes } from "react-icons/fa";

export default function ChatRoom() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [messages, setMessages] = useState([]);
  const [userColors, setUserColors] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Initialize roomId and userName
  useEffect(() => {
    const urlRoomId = new URL(window.location.href).pathname.split("/").pop();
    const storedUserName = localStorage.getItem("userName") || "Guest";
    setRoomId(urlRoomId);
    setUserName(storedUserName);

    const storedColor = localStorage.getItem(`userColor_${storedUserName}`) || generateRandomColor();
    localStorage.setItem(`userColor_${storedUserName}`, storedColor);
    setUserColors((prev) => ({ ...prev, [storedUserName]: storedColor }));
  }, []);

  // Manage online users
  useEffect(() => {
    if (!roomId || !userName) return;
    const onlineUsersRef = ref(database, `rooms/${roomId}/onlineUsers/${userName}`);

    // Set user online
    set(onlineUsersRef, true);

    // Remove user from online list when they disconnect
    onDisconnect(onlineUsersRef).remove();

    // Listen for online users
    const unsubscribe = onValue(ref(database, `rooms/${roomId}/onlineUsers`), (snapshot) => {
      setOnlineUsers(snapshot.val() ? Object.keys(snapshot.val()) : []);
    });

    return () => unsubscribe();
  }, [roomId, userName]);

  // Listen for new messages
  useEffect(() => {
    if (!roomId) return;

    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setMessages([]);
        return;
      }
      
      // Convert Firebase data to array with IDs
      const messageList = Object.entries(data).map(([id, message]) => ({
        id,
        ...message,
      }));
      
      // Sort by timestamp
      messageList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(messageList);

      // Assign colors to users
      setUserColors((prevColors) => {
        const newColors = { ...prevColors };
        messageList.forEach((msg) => {
          if (!newColors[msg.sender]) {
            newColors[msg.sender] = generateRandomColor();
          }
        });
        return newColors;
      });
    });

    return () => unsubscribe();
  }, [roomId]);

  // Track typing users
  useEffect(() => {
    if (!roomId) return;
    const typingRef = ref(database, `rooms/${roomId}/typing`);
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const typingData = snapshot.val();
      setTypingUsers(typingData ? Object.keys(typingData).filter((user) => user !== userName) : []);
    });

    return () => unsubscribe();
  }, [roomId, userName]);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      push(ref(database, `rooms/${roomId}/messages`), {
        text: newMessage.trim(),
        sender: userName,
        timestamp: Date.now(),
      });
      setNewMessage("");
    }
  };

  const copyRoomLink = () => {
    const roomLink = window.location.href;
    navigator.clipboard.writeText(roomLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleKeyDown = (e) => {
    const typingRef = ref(database, `rooms/${roomId}/typing/${userName}`);

    if (e.key === "Enter") {
      handleSendMessage();
      remove(typingRef);
    } else {
      set(typingRef, true);
      setTimeout(() => remove(typingRef), 3000);
    }
  };

  const handleBackToHome = () => router.push("/");


  const generateRandomColor = () => {
    let color;
    do {
      color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    } while (parseInt(color.substring(1, 3), 16) > 200);
    return color;
  };

  return (
    <div 
      className="flex items-center justify-center min-h-screen bg-black text-white font-mono px-3 py-6 sm:px-6 md:px-8"
      style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
        backgroundSize: '50px 50px'
      }}
    >
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center animate-fade-in">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 text-white cursor-pointer hover:text-white/80 transition-all"
            onClick={copyRoomLink}
          >
            {roomId ? `#${roomId}` : "Loading Room..."}
          </h1>
          {isCopied && <span className="text-sm text-white/70 block animate-fade-in">Link copied!</span>}
          <p className="text-sm sm:text-lg text-white/60">
            Welcome, <span className="font-semibold text-white">{userName || "Guest"}</span>
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="relative flex justify-center group">
            {/* Button showing number of active users */}
            <div className="flex items-center space-x-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
              <span className="text-sm font-medium text-white">
                {onlineUsers.length} Active {onlineUsers.length === 1 ? "User" : "Users"}
              </span>
            </div>

          {/* Active users list (only shows on hover) */}
          {onlineUsers.length > 0 && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none group-hover:pointer-events-auto">
              <div className="bg-black/95 backdrop-blur-lg text-sm rounded-xl p-4 shadow-2xl border border-white/20">
                <div className="flex items-center mb-2 space-x-2">
                  <div className="h-2 w-2 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                  <h3 className="font-semibold text-white">Currently Online</h3>
                </div>
                <ul className="grid gap-2 max-h-40 overflow-y-auto">
                  {onlineUsers.map((user, index) => (
                    <li
                      key={index}
                      className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-white/10"
                    >
                      <span className="h-2 w-2 bg-white rounded-full" />
                      <span className="text-white/80">{user}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          </div>

          {/* Search Button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/20 hover:border-white/40 transition-all"
            aria-label="Search messages"
          >
            <FaSearch className="text-sm text-white" />
          </button>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-lg border border-white/20">
            <FaSearch className="text-white/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-white/60 hover:text-white"
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>
        )}

        <div className="bg-black/30 rounded-xl border border-white/20 shadow-2xl max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
            <MessageList 
              messages={messages} 
              userColors={userColors} 
              userName={userName} 
              typingUsers={typingUsers}
              searchQuery={searchQuery}
            />
          <div className="p-3 border-t border-white/20">
            <MessageInput 
              roomId={roomId} 
              userName={userName}
            />
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="w-full max-w-lg mx-auto px-4 py-2 text-xs sm:text-sm font-medium text-white/70 hover:bg-white/10 rounded-lg border border-white/20 hover:border-white/40 flex justify-center items-center transition-all"
        >
          Return to Lobby
        </button>
      </div>
    </div>
  );
}

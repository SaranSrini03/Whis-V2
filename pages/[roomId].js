import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { database, ref, push, onValue, set, remove, onDisconnect } from "../lib/firebase";
import "tailwindcss/tailwind.css";
import MessageInput from "../components/MessageInput";
import MessageList from "../components/MessageList";
import { FaSearch, FaTimes, FaStop } from "react-icons/fa";

// Primary chat room experience: handles presence, messages, search, and teardown timer.
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
  const [showActiveUsersPopup, setShowActiveUsersPopup] = useState(false);
  const [deletionTimer, setDeletionTimer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const deletionTimerRef = useRef(null);

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

  // Manage online users and deletion timer
  useEffect(() => {
    if (!roomId || !userName) return;
    const onlineUsersRef = ref(database, `rooms/${roomId}/onlineUsers/${userName}`);
    const deletionTimerRef_db = ref(database, `rooms/${roomId}/deletionTimer`);

    // Set user online
    set(onlineUsersRef, true);

    // Remove user from online list when they disconnect
    onDisconnect(onlineUsersRef).remove();

    // Check if room is effectively empty when user joins (handles case when last user left)
    setTimeout(() => {
      onValue(ref(database, `rooms/${roomId}/onlineUsers`), (snapshot) => {
        const users = snapshot.val() ? Object.keys(snapshot.val()) : [];
        // If only current user (room effectively empty), start timer if not exists
        if (users.length === 1 && users[0] === userName) {
          onValue(deletionTimerRef_db, (timerSnapshot) => {
            if (!timerSnapshot.val()) {
              const deletionTime = Date.now() + 120000;
              set(deletionTimerRef_db, deletionTime);
            }
          }, { onlyOnce: true });
        }
      }, { onlyOnce: true });
    }, 1500); // Wait for Firebase to sync

    
    // Listen for online users
    const unsubscribeUsers = onValue(ref(database, `rooms/${roomId}/onlineUsers`), (snapshot) => {
      const usersData = snapshot.val();
      const users = usersData ? Object.keys(usersData) : [];
      setOnlineUsers(users);

      // If no users left, start deletion timer
      if (users.length === 0) {
        // Check if timer already exists, if not create one
        onValue(deletionTimerRef_db, (timerSnapshot) => {
          const existingTimer = timerSnapshot.val();
          if (!existingTimer) {
            // No timer exists, create one
            const deletionTime = Date.now() + 120000; // 2 minutes from now
            set(deletionTimerRef_db, deletionTime);
          }
        }, { onlyOnce: true });
      }
    });

    // Listen for deletion timer
    const unsubscribeTimer = onValue(deletionTimerRef_db, (snapshot) => {
      const deletionTime = snapshot.val();
      console.log('Deletion timer value:', deletionTime);
      if (deletionTime) {
        setDeletionTimer(deletionTime);
        console.log('Timer set, starting countdown');
        
        // Clear any existing interval
        if (deletionTimerRef.current) {
          clearInterval(deletionTimerRef.current);
        }

        // Start countdown
        const updateTimer = () => {
          const remaining = Math.max(0, Math.ceil((deletionTime - Date.now()) / 1000));
          setTimeRemaining(remaining);
          console.log('Time remaining:', remaining);

          if (remaining <= 0) {
            // Delete the room
            console.log('Timer expired, deleting room');
            const roomRef = ref(database, `rooms/${roomId}`);
            remove(roomRef).then(() => {
              console.log('Room deleted, redirecting...');
              router.push('/');
            }).catch((error) => {
              console.error("Error deleting room:", error);
            });
            clearInterval(deletionTimerRef.current);
            deletionTimerRef.current = null;
          }
        };

        updateTimer(); // Initial update
        deletionTimerRef.current = setInterval(updateTimer, 1000);
      } else {
        // Timer cancelled
        console.log('Timer cancelled or removed');
        if (deletionTimerRef.current) {
          clearInterval(deletionTimerRef.current);
          deletionTimerRef.current = null;
        }
        setDeletionTimer(null);
        setTimeRemaining(0);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTimer();
      if (deletionTimerRef.current) {
        clearInterval(deletionTimerRef.current);
      }
    };
  }, [roomId, userName, router]);

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

  // Handle Escape key to close popup
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showActiveUsersPopup) {
        setShowActiveUsersPopup(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showActiveUsersPopup]);

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

  const cancelRoomDeletion = async () => {
    if (!roomId) return;
    try {
      const deletionTimerRef_db = ref(database, `rooms/${roomId}/deletionTimer`);
      await remove(deletionTimerRef_db);
      console.log("Room deletion cancelled");
    } catch (error) {
      console.error("Error cancelling deletion:", error);
    }
  };

  // Debug function to manually start timer (for testing)
  const startDeletionTimer = async () => {
    if (!roomId) return;
    try {
      const deletionTimerRef_db = ref(database, `rooms/${roomId}/deletionTimer`);
      const deletionTime = Date.now() + 120000; // 2 minutes
      await set(deletionTimerRef_db, deletionTime);
      console.log("Timer started manually:", deletionTime);
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };


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

        <div className="flex items-center justify-center gap-3 flex-wrap">
          {/* Deletion Timer - Show when room is scheduled for deletion */}
          {deletionTimer && timeRemaining > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full backdrop-blur-sm animate-pulse">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-red-300">
                Room deleting in {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
              <button
                onClick={cancelRoomDeletion}
                className="ml-2 p-1.5 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-all border border-red-500/50"
                title="Cancel deletion"
                aria-label="Cancel room deletion"
              >
                <FaStop className="text-xs text-red-300" />
              </button>
            </div>
          )}

          {/* Button showing number of active users */}
          <button
            onClick={() => setShowActiveUsersPopup(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/20 hover:border-white/40 transition-all cursor-pointer"
          >
            <div className="h-2 w-2 bg-white rounded-full animate-pulse shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
            <span className="text-sm font-medium text-white">
              {onlineUsers.length} Active {onlineUsers.length === 1 ? "User" : "Users"}
            </span>
          </button>

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
          <div className="flex items-center gap-2 px-4 py-6 bg-black/40 rounded-full border border-white/20">
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

        {/* Active Users Popup Modal */}
        {showActiveUsersPopup && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowActiveUsersPopup(false);
              }
            }}
          >
            <div 
              className="bg-black/95 backdrop-blur-lg border-2 border-white/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(255,255,255,0.3)] max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                  <h2 className="text-2xl font-bold text-white">Active Users</h2>
                </div>
                <button
                  onClick={() => setShowActiveUsersPopup(false)}
                  className="px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-white/20"
                  aria-label="Close"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              
              {onlineUsers.length > 0 ? (
                <div className="overflow-y-auto flex-1">
                  <ul className="space-y-2">
                    {onlineUsers.map((user, index) => (
                      <li
                        key={index}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all border border-transparent hover:border-white/20"
                      >
                        <div className="h-2 w-2 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                        <span className="text-white font-medium">{user}</span>
                        {user === userName && (
                          <span className="ml-auto text-xs text-white/60 px-2 py-1 bg-white/10 rounded-full border border-white/20">
                            You
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-white/60">No active users</p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-white/20 text-center">
                <p className="text-sm text-white/60">
                  {onlineUsers.length} {onlineUsers.length === 1 ? "user" : "users"} online
                </p>
              </div>
            </div>
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
          className="w-full max-w-lg mx-auto px-4 py-2 text-xs bg-white sm:text-sm font-medium text-black hover:bg-white/10 rounded-lg border border-white/20 hover:text-white flex justify-center items-center transition-all"
        >
          Return to Lobby
        </button>
      </div>
    </div>
  );
}

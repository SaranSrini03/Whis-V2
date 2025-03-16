import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // Use next/navigation for routing
// import { database, ref, push, onValue0 } from "../lib/firebase";
import { database, ref, push, onValue, set, remove, onDisconnect } from "../lib/firebase";

import "tailwindcss/tailwind.css";

export default function ChatRoom() {
  const router = useRouter();
  const [roomId, setRoomId] = useState(""); // Store roomId safely
  const [userName, setUserName] = useState(""); // To store the user's name
  const [messages, setMessages] = useState([]); // To store chat messages
  const [newMessage, setNewMessage] = useState(""); // To store the current input message
  const [userColors, setUserColors] = useState({}); // To store user colors
  const messagesEndRef = useRef(null); // Ref to scroll to the latest message
  const messagesContainerRef = useRef(null); // Ref for the message container to detect manual scrolling
  const [isAtBottom, setIsAtBottom] = useState(true); // Track if the user is at the bottom
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);


  useEffect(() => {
    const urlRoomId = new URL(window.location.href).pathname.split("/").pop();
    setRoomId(urlRoomId);

    const storedUserName = localStorage.getItem("userName") || "Guest";
    setUserName(storedUserName);
  }, []);

  useEffect(() => {
    if (!roomId || !userName) return;

    const onlineUsersRef = ref(database, `rooms/${roomId}/onlineUsers/${userName}`);

    // Set user as online
    set(onlineUsersRef, true);

    // Remove user from online list when they leave
    onDisconnect(onlineUsersRef).remove();

    // Listen for online users
    const unsubscribe = onValue(ref(database, `rooms/${roomId}/onlineUsers`), (snapshot) => {
      const onlineData = snapshot.val();
      setOnlineUsers(onlineData ? Object.keys(onlineData) : []);
    });

    return () => unsubscribe();
  }, [roomId, userName]);

  useEffect(() => {
    const urlRoomId = new URL(window.location.href).pathname.split("/").pop();
    setRoomId(urlRoomId);

    const storedUserName = localStorage.getItem("userName") || "Guest";
    setUserName(storedUserName);

    const storedColor = localStorage.getItem(`userColor_${storedUserName}`) || generateRandomColor();
    localStorage.setItem(`userColor_${storedUserName}`, storedColor);
    setUserColors((prev) => ({ ...prev, [storedUserName]: storedColor }));
  }, []);
  // Empty dependency ensures this only runs once when the component mounts

  useEffect(() => {
    if (!roomId) return;

    const messagesRef = ref(database, `rooms/${roomId}/messages`);

    // Listen for new messages in real-time
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const messageList = data ? Object.values(data) : [];
      setMessages(messageList);

      // Assign a consistent color for each user who isn't the current user
      const colors = { ...userColors };
      messageList.forEach((message) => {
        if (message.sender !== userName && !colors[message.sender]) {
          colors[message.sender] = generateRandomColor();
        }
      });
      setUserColors(colors);

    });

    // Cleanup the listener when the component is unmounted
    return () => unsubscribe();

  }, [roomId, userName, userColors]);

  useEffect(() => {
    if (!roomId) return;

    const typingRef = ref(database, `rooms/${roomId}/typing`);
    onValue(typingRef, (snapshot) => {
      const typingData = snapshot.val();
      const activeTypers = typingData ? Object.keys(typingData).filter((user) => user !== userName) : [];
      setTypingUsers(activeTypers);
    });
  }, [roomId, userName]);

  useEffect(() => {
    // Scroll to the bottom only if the user is at the bottom
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]); // Trigger scrolling whenever messages change

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        text: newMessage.trim(),
        sender: userName,
        timestamp: Date.now(),
      };
      const messagesRef = ref(database, `rooms/${roomId}/messages`);
      push(messagesRef, message); // Use push to append messages
      setNewMessage(""); // Clear input field
    }
  };


  const handleKeyDown = (e) => {
    const typingRef = ref(database, `rooms/${roomId}/typing/${userName}`);

    if (e.key === "Enter") {
      handleSendMessage();
      remove(typingRef); // Remove typing status when message is sent
    } else {
      set(typingRef, true); // Set typing status to true when user types
      setTimeout(() => remove(typingRef), 3000); // Remove status if idle for 3s
    }
  };


  const handleBackToHome = () => {
    router.push("/"); // Navigate back to the home page
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString(); // Format the timestamp as a readable string
  };

  // Generate a random color
  const generateRandomColor = () => {
    let color;
    do {
      color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    } while (parseInt(color.substring(1, 3), 16) > 200); // Avoid too bright colors
    return color;
  };


  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      setIsAtBottom(container.scrollHeight - container.scrollTop <= container.clientHeight + 10);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-black text-white flex-col font-mono px-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Welcome to {roomId || "Loading..."} Room</h1>
      <p className="text-lg md:text-xl mb-6 text-center">Hello, {userName || "Guest"}!</p>

      <div className="relative group inline-block text-white text-sm mb-6 font-semibold">
        {/* Show number of online users */}
        <span className="cursor-pointer px-3 py-1 bg-green-600 rounded-3xl text-white shadow-md hover:bg-green-500 transition duration-200">
          {onlineUsers.length} Online
        </span>

        {/* Glassy Tooltip on Hover */}
        {onlineUsers.length > 0 && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-auto min-w-[120px] max-w-[200px] 
      bg-white/10 backdrop-blur-md text-white text-xs rounded-xl p-3 opacity-0 
      group-hover:opacity-100 transition-opacity duration-300 z-50 shadow-lg border border-white/20">

            <div className="font-semibold text-green-300 mb-1">Active Users:</div>
            <ul className="space-y-1">
              {onlineUsers.map((user, index) => (
                <li key={index} className="text-gray-200">{user}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Chat messages display */}
      <div
        className="w-full max-w-lg bg-[#131313] p-4 rounded-lg overflow-y-auto h-64 mb-4"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length > 0 ? (
          messages.map((message, index) => {
            // Get the user's color for the sender (if not the current user)
            const userColor = userColors[message.sender];

            return (
              <div
                key={index}
                className={`mb-4 ${message.sender === userName ? "text-right" : "text-left"}`}
              >
                {/* Display sender's name with background color */}
                <div
                  className="font-semibold inline-block"
                  style={{
                    backgroundColor: message.sender === userName ? "white" : userColor,
                    color: message.sender === userName ? "black" : "black",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    marginLeft: message.sender === userName ? "10px" : "0",
                    textAlign: "center",
                  }}
                >
                  {message.sender}
                </div>
                {/* Display message content */}
                <div
                  style={{
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    textAlign: message.sender === userName ? "right" : "left",
                    padding: "10px 5px",
                  }}
                >
                  {message.text}
                </div>
                <div className="text-xs text-gray-400">{formatTimestamp(message.timestamp)}</div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-400 text-center">No messages yet. Start the conversation!</p>
        )}

        {/* Online Users Display */}
        {/* <div className="mb-4 text-green-400">
          <h2 className="text-lg font-bold">Online Users:</h2>
          <p>{onlineUsers.length > 0 ? onlineUsers.join(", ") : "No one is online"}</p>
        </div> */}


        {/* 🔥 Add Typing Indicator Here */}
        {typingUsers.length > 0 && (
          <p className="text-gray-400 text-center text-sm mt-2">
            {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...
          </p>
        )}

        {/* Scroll to bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input field and send button */}
      <div className="flex items-center w-full max-w-lg space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-white bg-black text-white rounded-lg focus:outline-none"
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-3 bg-white text-black rounded-full hover:bg-gray-400"
        >
          ➔
        </button>
      </div>

      {/* Back to home button */}
      <button
        className="mt-4 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-300 w-full max-w-lg"
        onClick={handleBackToHome}
      >
        Back to Home
      </button>
    </div>
  );

}

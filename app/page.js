"use client"

import { useRouter } from "next/navigation"; // Import from next/navigation
import { useState } from 'react';
import "tailwindcss/tailwind.css"

export default function Home() {
  const router = useRouter(); // Initialize the router
  const [name, setName] = useState(""); // To store the entered name
  const [showOptions, setShowOptions] = useState(false); // To toggle the options display
  const [errorMessage, setErrorMessage] = useState(""); // To store error message
  const [isNameLocked, setIsNameLocked] = useState(false); // To lock the name after it's entered
  const [isJoinRoomModalOpen, setIsJoinRoomModalOpen] = useState(false); // To control modal visibility for join room
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false); // To control modal visibility for create room
  const [roomId, setRoomId] = useState(""); // To store room ID
  const [generatedRoomId, setGeneratedRoomId] = useState(""); // To store generated random room ID

  const handleClick = () => {
    if (!name.trim()) {
      setErrorMessage("Please enter a name.");
    } else if (name.trim().length < 3) {
      setErrorMessage("Name must be at least 3 characters long.");
    } else {
      setErrorMessage(""); // Clear error message if valid
      setShowOptions(true);
      setIsNameLocked(true); // Lock the name after clicking the button

      // Save userName to localStorage
      localStorage.setItem("userName", name.trim());
    }
  };
  

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (!name.trim()) {
        setErrorMessage("Please enter a name.");
      } else if (name.trim().length < 3) {
        setErrorMessage("Name must be at least 3 characters long.");
      } else {
        setErrorMessage(""); // Clear error message if valid
        setShowOptions(true);
        setIsNameLocked(true); // Lock the name after pressing Enter

        // Save userName to localStorage
        localStorage.setItem("userName", name.trim());
      }
    }
  };

  const handleJoinRoom = () => {
    setIsJoinRoomModalOpen(true); // Open the join room modal
  };

  const handleCreateRoom = () => {
    setIsCreateRoomModalOpen(true); // Open the create room modal
  };

  const handleRoomIdSubmit = () => {
    if (roomId.trim()) {
      // Redirect to the room page using the roomId
      router.push(`${roomId}`); // Navigate to the room page
      setIsJoinRoomModalOpen(false); // Close the modal after submitting room ID
    } else {
      setErrorMessage("Please enter a room ID.");
    }
  };

  const handleCreateRoomWithRandomId = () => {
    const randomId = generateRandomRoomId(); // Generate random room ID directly
    console.log(`Creating room with random ID: ${randomId}`);
    setIsCreateRoomModalOpen(false); // Close modal after generating random ID
    router.push(randomId); // Redirect to the created room
  };
  
  const generateRandomRoomId = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; // Define characters for room ID
    let randomId = "";
    for (let i = 0; i < 5; i++) {
      randomId += characters.charAt(Math.floor(Math.random() * characters.length)); // Generate a random ID
    }
    return randomId; // Return the generated random ID directly
  };
  

  const handleCreateRoomWithEnteredId = () => {
    console.log(`Creating room with entered ID: ${roomId}`);
    setIsCreateRoomModalOpen(false); // Close modal after creating room with entered ID
    router.push(roomId); // Redirect to the created room
  };

  return (
    <div className="flex items-center justify-center h-screen bg-black text-white flex-col font-mono px-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Welcome to Whis.</h1>
  
      <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-4 md:space-y-0">
        {!isNameLocked ? (
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-4 py-2 border border-white bg-black text-white rounded-lg focus:outline-none w-full md:w-auto"
          />
          

        ) : (
          <p className="text-xl text-center">Your name is {name}</p>
        )}
  
        {!isNameLocked && (
          <button
            className="px-4 py-2 bg-white md:w-auto w-full text-black rounded-lg hover:bg-gray-300"
            onClick={handleClick}
          >
            ➔
          </button>
        )}
      </div>
  
      {errorMessage && <p className="text-red-500 mt-4 text-center">{errorMessage}</p>}
  
      {showOptions && (
        <div className="mt-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <button
            className="px-6 py-3 bg-black text-white border border-white rounded-2xl hover:bg-gray-300 hover:text-black w-full md:w-auto"
            onClick={handleJoinRoom}
          >
            Join Room
          </button>
          <button
            className="px-6 py-3 bg-black text-white border border-white rounded-2xl hover:bg-gray-300 hover:text-black w-full md:w-auto"
            onClick={handleCreateRoom}
          >
            Create Room
          </button>
        </div>
      )}
  
      {isJoinRoomModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white text-black p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Enter Room ID</h2>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-4 py-2 border border-black rounded-lg mb-4"
              placeholder="Room ID"
            />
            <div className="flex space-x-4">
              <button
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-300"
                onClick={handleRoomIdSubmit}
              >
                Join
              </button>
              <button
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400"
                onClick={() => setIsJoinRoomModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
  
      {isCreateRoomModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-md" />
          <div className="bg-white text-black p-6 rounded-lg w-full max-w-md relative z-10">
            <button
              className="text-3xl text-black absolute top-2 right-2"
              onClick={() => setIsCreateRoomModalOpen(false)}
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4">Create Room</h2>
            <div className="flex flex-col space-y-4">
              <button
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-300"
                onClick={handleCreateRoomWithRandomId}
              >
                Create Random Room ID
              </button>
              <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-4 md:space-y-0">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 border border-black rounded-lg"
                  placeholder="Enter your own room ID"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoomWithEnteredId()}
                />
                <button
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-300 border border-black w-full md:w-auto"
                  onClick={handleCreateRoomWithEnteredId}
                >
                  ➔
                </button>
              </div>
            </div>
          </div>

        </div>
        
      )}
        <h6 className="text-sm md:text-sm font-bold mt-6 text-center">Made by Nearcult | V-2</h6>

    </div>
  );
  
}

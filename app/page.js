"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import "tailwindcss/tailwind.css";

// Landing screen for collecting a display name and routing into rooms.
export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isNameLocked, setIsNameLocked] = useState(false);
  const [isJoinRoomModalOpen, setIsJoinRoomModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [roomId, setRoomId] = useState("");

  // Ensure the user provides a usable display name before proceeding.
  const validateName = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Please enter a name.");
      return null;
    }
    if (trimmedName.length < 3) {
      setErrorMessage("Name must be at least 3 characters long.");
      return null;
    }
    setErrorMessage("");
    return trimmedName;
  }, [name]);

  // Gate room access behind a validated name and persist it locally.
  const handleClick = () => {
    const trimmedName = validateName();
    if (!trimmedName) return;

    setShowOptions(true);
    setIsNameLocked(true);
    localStorage.setItem("userName", trimmedName);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleClick();
    }
  };

  const handleJoinRoom = () => {
    setIsJoinRoomModalOpen(true);
  };

  const handleCreateRoom = () => {
    setIsCreateRoomModalOpen(true);
  };

  // Move the user into an existing room when they provide an ID.
  const handleRoomIdSubmit = () => {
    if (!roomId.trim()) {
      setErrorMessage("Please enter a room ID.");
      return;
    }
    router.push(`/${roomId.trim()}`);
    setIsJoinRoomModalOpen(false);
  };

  // Create a room using a random short identifier.
  const handleCreateRoomWithRandomId = () => {
    const randomId = generateRandomRoomId();
    setIsCreateRoomModalOpen(false);
    router.push(`/${randomId}`);
  };

  const generateRandomRoomId = useCallback(() => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomId = "";
    for (let i = 0; i < 5; i += 1) {
      randomId += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return randomId;
  }, []);

  // Create a room with the exact ID the user types.
  const handleCreateRoomWithEnteredId = () => {
    if (!roomId.trim()) {
      setErrorMessage("Please enter a room ID.");
      return;
    }
    setIsCreateRoomModalOpen(false);
    router.push(`/${roomId.trim()}`);
  };

  return (
    <div
      className="flex h-screen flex-col items-center justify-center bg-black px-4 font-mono text-white"
      style={{
        backgroundImage:
          "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)",
        backgroundSize: "50px 50px",
      }}
    >
      <h1 className="mb-6 text-center text-3xl font-bold text-white md:text-4xl">
        Welcome to Whis.
      </h1>

      <div className="flex flex-col items-center space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        {!isNameLocked ? (
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-black/40 px-4 py-2 text-white border border-white/30 focus:border-white/50 focus:outline-none md:w-auto"
          />
        ) : (
          <p className="text-center text-xl">Your name is {name}</p>
        )}

        {!isNameLocked && (
          <button
            className="w-full rounded-full bg-white px-4 py-3 text-black font-semibold shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:bg-white/90 md:w-auto"
            onClick={handleClick}
          >
            ➔
          </button>
        )}
      </div>

      {errorMessage && (
        <p className="mt-4 text-center text-white/80">{errorMessage}</p>
      )}

      {showOptions && (
        <div className="mt-6 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
          <button
            className="w-full rounded-2xl border border-white/30 bg-black/40 px-6 py-3 text-white transition-all hover:border-white/50 hover:bg-white/10 md:w-auto"
            onClick={handleJoinRoom}
          >
            Join Room
          </button>
          <button
            className="w-full rounded-2xl border border-white bg-white px-6 py-3 font-semibold text-black shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all hover:bg-white/90 md:w-auto"
            onClick={handleCreateRoom}
          >
            Create Room
          </button>
        </div>
      )}

      {isJoinRoomModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/30 bg-black p-6 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <h2 className="mb-4 text-2xl font-bold text-white">Enter Room ID</h2>
            <input
              type="text"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              className="mb-4 w-full rounded-lg border border-white/30 bg-black/40 px-4 py-2 text-white focus:border-white/50 focus:outline-none"
              placeholder="Room ID"
            />
            <div className="flex space-x-4">
              <button
                className="rounded-lg bg-white px-6 py-2 font-semibold text-black shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:bg-white/90"
                onClick={handleRoomIdSubmit}
              >
                Join
              </button>
              <button
                className="rounded-lg border border-white/30 bg-black px-6 py-2 text-white hover:bg-white/10"
                onClick={() => setIsJoinRoomModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateRoomModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="relative z-10 w-full max-w-md rounded-lg border border-white/30 bg-black p-6 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <button
              className="absolute right-2 top-2 text-3xl text-white/70 hover:text-white"
              onClick={() => setIsCreateRoomModalOpen(false)}
            >
              ×
            </button>
            <h2 className="mb-4 text-2xl font-bold text-white">Create Room</h2>
            <div className="flex flex-col space-y-4">
              <button
                className="rounded-lg bg-white px-6 py-2 font-semibold text-black shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:bg-white/90"
                onClick={handleCreateRoomWithRandomId}
              >
                Create Random Room ID
              </button>
              <div className="flex flex-col items-center space-y-4 md:flex-row md:space-x-4 md:space-y-0">
                <input
                  type="text"
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value)}
                  className="w-full rounded-lg border border-white/30 bg-black/40 px-4 py-2 text-white focus:border-white/50 focus:outline-none md:w-64"
                  placeholder="Enter your own room ID"
                  onKeyDown={(event) =>
                    event.key === "Enter" && handleCreateRoomWithEnteredId()
                  }
                />
                <button
                  className="w-full rounded-lg border border-white bg-white px-4 py-2 font-semibold text-black shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:bg-white/90 md:w-auto"
                  onClick={handleCreateRoomWithEnteredId}
                >
                  ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h6 className="mt-6 text-center text-sm font-bold text-white/50 md:text-sm">
        Made by Nearcult [saran srini] | V-2
      </h6>
    </div>
  );
}

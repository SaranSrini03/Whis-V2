'use client';
import { useState, useCallback, useEffect, useRef } from "react";
import { database, ref, push, remove, set } from "../lib/firebase";
import { FaFile, FaMapMarkerAlt, FaMicrophone, FaImage, FaPoll, FaPlus, FaSmile } from "react-icons/fa";
import EmojiPicker from 'emoji-picker-react';

export default function MessageInput({ roomId, userName }) {
    const [newMessage, setNewMessage] = useState("");
    const [showOptions, setShowOptions] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSendMessage = useCallback(async () => {
        if (!newMessage.trim() || !userName || !roomId) return;

        try {
            const message = {
                text: newMessage.trim(),
                sender: userName,
                timestamp: Date.now(),
                edited: false,
                reactions: {},
            };

            const messagesRef = ref(database, `rooms/${roomId}/messages`);
            await push(messagesRef, message);
            setNewMessage("");
            setShowEmojiPicker(false);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    }, [newMessage, roomId, userName]);

    const handleKeyDown = useCallback((e) => {
        if (!roomId || !userName) return;

        const typingRef = ref(database, `rooms/${roomId}/typing/${userName}`);

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
            remove(typingRef);
            setIsTyping(false);
        } else {
            if (!isTyping) {
                set(typingRef, true);
                setIsTyping(true);
            }
            const timeout = setTimeout(() => {
                remove(typingRef);
                setIsTyping(false);
            }, 3000);

            return () => clearTimeout(timeout);
        }
    }, [handleSendMessage, isTyping, roomId, userName]);

    const onEmojiClick = (emojiData) => {
        setNewMessage(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };


    return (
        <div className="relative flex items-center gap-2 flex-wrap sm:flex-nowrap w-full max-w-2xl p-2">
                {showOptions && (
                    <div className="absolute bottom-full left-0 mb-2 bg-black/95 backdrop-blur-lg text-white p-3 rounded-xl shadow-2xl border border-white/20 flex gap-3 flex-wrap sm:flex-nowrap z-50">
                        {[
                            { icon: <FaImage className="text-purple-400" />, label: "Image" },
                            { icon: <FaFile className="text-blue-400" />, label: "File" },
                            { icon: <FaMapMarkerAlt className="text-green-400" />, label: "Location" },
                            { icon: <FaMicrophone className="text-red-400" />, label: "Voice" },
                            { icon: <FaPoll className="text-yellow-400" />, label: "Poll" },
                        ].map((item) => (
                            <button
                                key={item.label}
                                className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 transition-all duration-200 group border border-transparent hover:border-white/20"
                                aria-label={item.label}
                            >
                                <span className="text-lg sm:text-xl mb-1 group-hover:-translate-y-1 transition-transform text-white">
                                    {item.icon}
                                </span>
                                <span className="text-xs text-white/70 group-hover:text-white">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 z-50">
                        <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                    </div>
                )}

                <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="p-3 bg-black/40 backdrop-blur-sm text-white rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all"
                    aria-label="Attach file"
                >
                    <FaPlus className="transform transition-transform duration-300 hover:rotate-90" />
                </button>

                <textarea
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={1}
                    className="flex-1 px-4 py-3 border border-white/20 bg-black/40 backdrop-blur-sm text-white rounded-xl focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all placeholder-white/40 w-full sm:w-auto resize-none max-h-[120px] overflow-y-auto"
                    aria-label="Type your message"
                />

                <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-3 bg-black/40 backdrop-blur-sm text-white rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all"
                    aria-label="Add emoji"
                >
                    <FaSmile />
                </button>

                <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-3 bg-white text-black rounded-xl hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] font-semibold"
                    aria-label="Send message"
                >
                    <svg
                        className="w-5 h-5 transform hover:translate-x-0.5 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                        />
                    </svg>
                </button>
        </div>
    );
}
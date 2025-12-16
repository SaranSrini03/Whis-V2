"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { database, ref, push, remove, set } from "../lib/firebase";
import { FaImage, FaPlus, FaSmile, FaTimes } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";

// Input surface for composing chat messages, including emoji and image uploads.
export default function MessageInput({ roomId, userName }) {
    const [newMessage, setNewMessage] = useState("");
    const [showOptions, setShowOptions] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const emojiPickerRef = useRef(null);
    const imageInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileSelect = async (file) => {
        if (!file || !roomId) return;

        // If a file is already selected, remove it first
        if (selectedFile) {
            removeSelectedFile();
        }

        // Validate file size (max 5MB for images)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert("Image size must be less than 5MB");
            return;
        }

        setSelectedFile({ file, isImage: true, preview: URL.createObjectURL(file) });
        setShowOptions(false);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                handleFileSelect(file);
            } else {
                alert("Please select an image file");
            }
        }
    };


    const removeSelectedFile = () => {
        if (selectedFile?.preview) {
            URL.revokeObjectURL(selectedFile.preview);
        }
        setSelectedFile(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    // Convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    // Upload image either to ImgBB when available or inline as base64.
    const uploadImage = async (file) => {
        if (!file || !roomId) return null;

        try {
            setUploading(true);
            setUploadProgress(20);

            // Validate file size (max 5MB for base64 storage)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new Error("Image size must be less than 5MB");
            }

            // Convert image to base64 for ImgBB
            setUploadProgress(40);
            const base64Image = await fileToBase64(file);
            
            // Extract base64 data (remove data:image/...;base64, prefix)
            const base64Data = base64Image.split(',')[1];
            
            setUploadProgress(60);

            // Try ImgBB first if API key is provided
            const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
            
            if (apiKey && apiKey !== 'YOUR_IMGBB_API_KEY') {
                try {
                    const formData = new FormData();
                    formData.append('image', base64Data);
                    
                    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data?.url) {
                            setUploadProgress(100);
                            setUploading(false);
                            return data.data.url;
                        }
                    }
                } catch (imgbbError) {
                    console.log("ImgBB upload failed, trying alternative...", imgbbError);
                }
            }
            
            // Fallback: Use base64 data URL (always works, stored in database)
            // This is reliable and works without external services
            // For images < 5MB, this is acceptable
            setUploadProgress(80);
            console.log("Using base64 encoding - image stored in database");
            setUploadProgress(100);
            setUploading(false);
            
            // Return the full data URL
            // The message will store this and display it directly
            return base64Image;
            
        } catch (error) {
            console.error("Error uploading image:", error);
            setUploading(false);
            setUploadProgress(0);
            
            // Show detailed error
            const errorMessage = error.message || 'Unknown error occurred';
            console.error("Upload error details:", errorMessage);
            alert(`Error uploading image: ${errorMessage}. Please try again or use a smaller file.`);
            return null;
        }
    };

    const uploadFile = async (file) => {
        // Only handle images
        return await uploadImage(file);
    };

    // Push the composed message (and optional image) into the room timeline.
    const handleSendMessage = useCallback(async () => {
        if ((!newMessage.trim() && !selectedFile) || !userName || !roomId) return;

        try {
            let fileUrl = null;
            let fileType = null;
            let fileName = null;

            // Upload image if one is selected
            const currentSelectedFile = selectedFile; // Store reference before clearing
            if (currentSelectedFile) {
                fileUrl = await uploadFile(currentSelectedFile.file);
                if (!fileUrl) {
                    // Upload failed, but still clear the state
                    setUploading(false);
                    setUploadProgress(0);
                    return;
                }
                
                fileType = 'image';
                fileName = currentSelectedFile.file.name;
                
                // Clean up preview URL immediately
                if (currentSelectedFile.preview) {
                    URL.revokeObjectURL(currentSelectedFile.preview);
                }
                
                // Clear selected file immediately after successful upload
                setSelectedFile(null);
                if (imageInputRef.current) imageInputRef.current.value = '';
            }

            const message = {
                text: newMessage.trim() || '',
                sender: userName,
                timestamp: Date.now(),
                edited: false,
                reactions: {},
                ...(fileUrl && { fileUrl, fileType, fileName }),
            };

            const messagesRef = ref(database, `rooms/${roomId}/messages`);
            await push(messagesRef, message);
            
            // Clear all states after successful send
            setNewMessage("");
            setSelectedFile(null);
            setShowEmojiPicker(false);
            setUploading(false);
            setUploadProgress(0);
            if (imageInputRef.current) imageInputRef.current.value = '';
        } catch (error) {
            console.error("Error sending message:", error);
            // Clear states even on error
            setSelectedFile(null);
            setUploading(false);
            setUploadProgress(0);
            if (imageInputRef.current) imageInputRef.current.value = '';
        }
    }, [newMessage, roomId, userName, selectedFile]);

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
        <div className="relative flex flex-col gap-2 w-full max-w-2xl p-2">
                {/* Image Preview */}
                {selectedFile && selectedFile.preview && (
                    <div className="relative bg-black/60 border border-white/20 rounded-xl p-3 flex items-center gap-3">
                        <img 
                            src={selectedFile.preview} 
                            alt="Preview" 
                            className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{selectedFile.file.name}</p>
                            <p className="text-xs text-white/60">
                                {(selectedFile.file.size / 1024).toFixed(2)} KB
                            </p>
                        </div>
                        <button
                            onClick={removeSelectedFile}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            aria-label="Remove image"
                        >
                            <FaTimes />
                        </button>
                    </div>
                )}

                {/* Upload Progress */}
                {uploading && (
                    <div className="bg-black/60 border border-white/20 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                                <div 
                                    className="bg-white h-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <span className="text-xs text-white/60">{uploadProgress}%</span>
                        </div>
                        <p className="text-xs text-white/60">Uploading...</p>
                    </div>
                )}

                <div className="relative flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Hidden image input */}
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    multiple={false}
                    className="hidden"
                />

                {showOptions && (
                    <div className="absolute bottom-full left-0 mb-2 bg-black/95 backdrop-blur-lg text-white p-3 rounded-xl shadow-2xl border border-white/20 z-50">
                        <button
                            onClick={() => {
                                imageInputRef.current?.click();
                                setShowOptions(false);
                            }}
                            className="flex flex-col items-center p-3 rounded-lg hover:bg-white/10 transition-all duration-200 group border border-transparent hover:border-white/20"
                            aria-label="Image"
                        >
                            <span className="text-xl mb-2 group-hover:-translate-y-1 transition-transform text-white">
                                <FaImage className="text-purple-400" />
                            </span>
                            <span className="text-sm text-white/70 group-hover:text-white font-medium">
                                Image
                            </span>
                        </button>
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
                    disabled={(!newMessage.trim() && !selectedFile) || uploading}
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
        </div>
    );
}
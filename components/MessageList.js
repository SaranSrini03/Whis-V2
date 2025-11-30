// components/MessageList.js
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { database, ref, set, remove } from "../lib/firebase";
import { FaEdit, FaTrash, FaSmile, FaTimes } from "react-icons/fa";
// Custom black/white theme for code highlighting

export default function MessageList({ messages, userColors, userName, typingUsers, searchQuery }) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showReactions, setShowReactions] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const longPressTimer = useRef(null);

  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close if clicking on the context menu or reaction picker
      if (e.target.closest('.context-menu') || e.target.closest('.reaction-picker-container')) {
        return;
      }
      setContextMenu(null);
      // Only close reaction picker if not clicking on it
      if (!e.target.closest('.reaction-picker-container')) {
        setShowReactionPicker(null);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setShowReactionPicker(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      setIsAtBottom(container.scrollHeight - container.scrollTop <= container.clientHeight + 10);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const handleEdit = (message) => {
    setEditingMessageId(message.id);
    setEditText(message.text);
  };

  const handleSaveEdit = async (messageId, roomId) => {
    if (!editText.trim()) return;
    
    try {
      const messageRef = ref(database, `rooms/${roomId}/messages/${messageId}`);
      await set(messageRef, {
        ...messages.find(m => m.id === messageId),
        text: editText.trim(),
        edited: true,
        editedAt: Date.now()
      });
      setEditingMessageId(null);
      setEditText("");
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  const handleDelete = async (messageId, roomId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    try {
      const messageRef = ref(database, `rooms/${roomId}/messages/${messageId}`);
      await remove(messageRef);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleReaction = async (messageId, roomId, emoji) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const reactions = message.reactions || {};
      
      // Find the emoji the user previously reacted with (if any)
      let previousEmoji = null;
      for (const [emojiKey, users] of Object.entries(reactions)) {
        if (users.includes(userName)) {
          previousEmoji = emojiKey;
          break;
        }
      }
      
      // Remove user from their previous reaction (if any)
      if (previousEmoji) {
        reactions[previousEmoji] = reactions[previousEmoji].filter(u => u !== userName);
        if (reactions[previousEmoji].length === 0) {
          delete reactions[previousEmoji];
        }
      }
      
      // If clicking the same emoji they already had, don't add it back (removes reaction)
      // Otherwise, add the new reaction
      if (previousEmoji !== emoji) {
        if (reactions[emoji]) {
          reactions[emoji] = [...reactions[emoji], userName];
        } else {
          reactions[emoji] = [userName];
        }
      }

      const messageRef = ref(database, `rooms/${roomId}/messages/${messageId}`);
      await set(messageRef, {
        ...message,
        reactions: reactions
      });
      setShowReactionPicker(null);
      setContextMenu(null);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const showContextMenu = (messageId) => {
    setContextMenu({ messageId });
  };

  const handleContextMenu = (e, messageId) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(messageId);
  };

  const handleTouchStart = (e, messageId) => {
    longPressTimer.current = setTimeout(() => {
      e.preventDefault();
      showContextMenu(messageId);
      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const highlightSearchText = (text, query) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-white/20 text-white">{part}</mark>
      ) : part
    );
  };

  const getRoomId = () => {
    if (typeof window !== 'undefined' && window.location) {
      try {
        return new URL(window.location.href).pathname.split("/").pop();
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const filteredMessages = searchQuery
    ? messages.filter(msg => 
        (msg.text && msg.text.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (msg.sender && msg.sender.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : messages;

  return (
    <div className="flex flex-col h-[400px] w-full">
      {/* Context Menu Bar - Horizontal */}
      {contextMenu && (
        <div 
          className="context-menu flex items-center gap-2 px-4 py-2 bg-black/95 border-b border-white/30 rounded-t-xl backdrop-blur-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReactionPicker(contextMenu.messageId);
              setContextMenu(null);
            }}
            className="px-3 py-1.5 text-white hover:bg-white/10 rounded flex items-center gap-2 text-sm border border-white/20 transition-all"
          >
            <FaSmile className="text-white/60" />
            Reaction
          </button>
          {messages.find(m => m.id === contextMenu.messageId)?.sender === userName && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const message = messages.find(m => m.id === contextMenu.messageId);
                  if (message) {
                    handleEdit(message);
                  }
                  setContextMenu(null);
                }}
                className="px-3 py-1.5 text-white hover:bg-white/10 rounded flex items-center gap-2 text-sm border border-white/20 transition-all"
              >
                <FaEdit className="text-white/60" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const roomId = getRoomId();
                  if (roomId) {
                    handleDelete(contextMenu.messageId, roomId);
                  }
                  setContextMenu(null);
                }}
                className="px-3 py-1.5 text-white hover:bg-white/10 rounded flex items-center gap-2 text-sm border border-white/20 transition-all"
              >
                <FaTrash className="text-white/60" />
                Delete
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
            }}
            className="ml-auto px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-all"
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto rounded-xl bg-black/50 backdrop-blur-lg p-4 border border-white/20 shadow-inner ${contextMenu ? 'rounded-t-none' : ''}`}
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      >
      {filteredMessages.length > 0 ? (
        filteredMessages.map((message, index) => {
          const isOwnMessage = message.sender === userName;
          const userColor = userColors[message.sender];
          const isEditing = editingMessageId === message.id;
          const roomId = getRoomId();
          const messageId = message.id || index.toString();

          return (
            <div
              key={messageId}
              className={`message-container mb-4 group ${isOwnMessage ? "items-end" : "items-start"}`}
            >
              <div className={`flex flex-col ${isOwnMessage ? "ml-12" : "mr-12"}`}>
                {/* Message Bubble */}
                <div
                  onContextMenu={(e) => handleContextMenu(e, messageId)}
                  onTouchStart={(e) => handleTouchStart(e, messageId)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  className={`message-bubble
                    p-3 rounded-xl max-w-[80%] relative cursor-context-menu select-none
                    ${isOwnMessage 
                      ? "bg-white/10 border border-white/30 ml-auto shadow-[0_0_10px_rgba(255,255,255,0.1)]" 
                      : "bg-black/40 border border-white/20 mr-auto shadow-[0_0_5px_rgba(255,255,255,0.05)]"}
                    hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all
                    active:opacity-80
                  `}
                >
                  {/* Sender Name */}
                  {!isOwnMessage && (
                    <div 
                      className="text-xs font-semibold mb-1 text-white"
                    >
                      {message.sender}
                    </div>
                  )}
                  
                  {/* Message Content */}
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-2 py-1 bg-black/50 text-white rounded border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(messageId, roomId)}
                          className="px-3 py-1 bg-white text-black rounded text-xs hover:bg-white/80 font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditText("");
                          }}
                          className="px-3 py-1 bg-black border border-white/30 text-white rounded text-xs hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-white text-sm break-words">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          code: ({ node, inline, className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <pre className="bg-black/80 p-3 rounded-lg overflow-x-auto my-2 border border-white/20">
                                <code className={`${className} text-white/90`} {...props} style={{ background: 'transparent' }}>
                                  {children}
                                </code>
                              </pre>
                            ) : (
                              <code className="bg-black/40 px-1.5 py-0.5 rounded text-white border border-white/10 text-xs" {...props}>
                                {children}
                              </code>
                            );
                          },
                          p: ({ children }) => {
                            if (searchQuery && typeof children === 'string') {
                              return <p>{highlightSearchText(children, searchQuery)}</p>;
                            }
                            return <p className="my-1">{children}</p>;
                          },
                          h1: ({ children }) => <h1 className="text-lg font-bold my-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold my-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold my-1">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="ml-2">{children}</li>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-white/30 pl-3 my-2 italic text-white/70">{children}</blockquote>,
                          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-white/80">{children}</a>,
                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                        }}
                      >
                        {message.text || ''}
                      </ReactMarkdown>
                    </div>
                  )}
                  
                  {/* Reactions */}
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(message.reactions).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(messageId, roomId, emoji)}
                          className={`px-2 py-1 rounded-full text-xs border ${
                            users.includes(userName)
                              ? 'bg-white/20 border-white/40 shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                              : 'bg-black/40 border-white/20'
                          } hover:bg-white/10 transition-all`}
                          title={users.join(', ')}
                        >
                          <span className="mr-1">{emoji}</span>
                          <span className="text-white">{users.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Timestamp and Edited Indicator */}
                  <div className={`flex items-center gap-2 text-xs mt-1 ${isOwnMessage ? "text-white/70 justify-end" : "text-white/50 justify-start"}`}>
                    {formatTimestamp(message.timestamp)}
                    {message.edited && (
                      <span className="text-white/40 italic">(edited)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="flex items-center justify-center h-full text-white/40">
          <p className="text-center">
            {searchQuery ? "No messages found." : (
              <>
                No messages yet.<br />
                Be the first to say something!
              </>
            )}
          </p>
        </div>
      )}

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="sticky bottom-2 mt-4">
          <div className="inline-block px-4 py-2 bg-black/60 border border-white/20 backdrop-blur-sm rounded-full text-sm text-white/70">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-2 h-2 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <span>{typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />

      {/* Reaction Picker Full-Screen Modal */}
      {showReactionPicker && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowReactionPicker(null);
            }
          }}
        >
          <div 
            className="reaction-picker-container bg-black/95 backdrop-blur-lg border-2 border-white/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(255,255,255,0.3)] max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center justify-between w-full mb-2">
                <h2 className="text-2xl font-bold text-white">Add Reaction</h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactionPicker(null);
                  }}
                  className="px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-white/20"
                  aria-label="Close"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 w-full">
                {[
                  { emoji: '😊', label: 'Smile' },
                  { emoji: '😢', label: 'Cry' },
                  { emoji: '😠', label: 'Angry' },
                  { emoji: '😂', label: 'Laugh' },
                  { emoji: '❤️', label: 'Heart' },
                  { emoji: '👍', label: 'Thumbs Up' }
                ].map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      const roomId = getRoomId();
                      if (roomId) {
                        handleReaction(showReactionPicker, roomId, emoji);
                      }
                    }}
                    className="flex flex-col items-center justify-center px-6 py-6 text-5xl hover:bg-white/20 rounded-xl transition-all transform hover:scale-110 active:scale-95 border-2 border-transparent hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                    title={label}
                    aria-label={label}
                  >
                    <span>{emoji}</span>
                    <span className="text-xs text-white/60 mt-2">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

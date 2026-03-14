import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  arrayUnion,
  getDoc,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { Send, User, ArrowLeft, MoreVertical, Trash2, Clock, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { handleFirestoreError, OperationType } from '../../utils/firestoreError';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: any;
  deletedFor: string[];
  isDeletedEveryone?: boolean;
  type?: 'text' | 'image';
}

interface ChatRoomProps {
  chatId: string;
  onBack: () => void;
}

export default function ChatRoom({ chatId, onBack }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<any>(null);
  const socketRef = useRef<any>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!chatId || !user) return;

    // Fetch other user info
    const fetchOtherUser = async () => {
      const chatPath = `chats/${chatId}`;
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (chatDoc.exists()) {
          const participantIds = chatDoc.data().participantIds;
          const otherId = participantIds.find((id: string) => id !== user.uid);
          if (otherId) {
            const userPath = `users/${otherId}`;
            try {
              const userDoc = await getDoc(doc(db, 'users', otherId));
              if (userDoc.exists()) {
                setOtherUser(userDoc.data());
              }
            } catch (err) {
              handleFirestoreError(err, OperationType.GET, userPath);
            }
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, chatPath);
      }
    };
    fetchOtherUser();

    // Socket.io connection
    socketRef.current = io();
    socketRef.current.emit('join_chat', chatId);

    // Firestore messages listener
    const messagesPath = `chats/${chatId}/messages`;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      // Filter out messages deleted for current user
      setMessages(msgs.filter(m => !m.deletedFor?.includes(user.uid)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, messagesPath);
    });

    return () => {
      unsubscribe();
      socketRef.current?.disconnect();
    };
  }, [chatId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msgContent = newMessage.trim();
    setNewMessage('');

    const messagesPath = `chats/${chatId}/messages`;
    const chatPath = `chats/${chatId}`;

    try {
      const msgData = {
        senderId: user.uid,
        content: msgContent,
        timestamp: serverTimestamp(),
        type: 'text',
        deletedFor: [],
        isDeletedEveryone: false
      };

      await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);
      
      // Update last message in chat doc
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: msgContent,
        lastUpdatedAt: serverTimestamp()
      });

      // Emit via socket for real-time notification
      socketRef.current.emit('send_message', {
        chatId,
        ...msgData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, messagesPath);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setError(null);
    
    const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Max dimension for Firestore safety (approx 800px)
            const MAX_DIM = 1000;
            if (width > height) {
              if (width > MAX_DIM) {
                height *= MAX_DIM / width;
                width = MAX_DIM;
              }
            } else {
              if (height > MAX_DIM) {
                width *= MAX_DIM / height;
                height = MAX_DIM;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with 0.6 quality to stay under 1MB limit
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            resolve(dataUrl);
          };
          img.onerror = reject;
        };
        reader.onerror = reject;
      });
    };

    try {
      const compressedBase64 = await compressImage(file);
      
      const messagesPath = `chats/${chatId}/messages`;
      const msgData = {
        senderId: user.uid,
        content: compressedBase64,
        timestamp: serverTimestamp(),
        type: 'image',
        deletedFor: [],
        isDeletedEveryone: false
      };

      await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);
      
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: '📷 Photo',
        lastUpdatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error("Image upload error:", error);
      setError('Failed to process image');
      setTimeout(() => setError(null), 3000);
    }
  };

  const deleteForMe = async (messageId: string) => {
    if (!user) return;
    const msgPath = `chats/${chatId}/messages/${messageId}`;
    try {
      await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
        deletedFor: arrayUnion(user.uid)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, msgPath);
    }
  };

  const deleteForEveryone = async (messageId: string, timestamp: any) => {
    if (!user) return;
    const msgPath = `chats/${chatId}/messages/${messageId}`;
    setError(null);
    
    // Check 2 hour window
    const msgTime = timestamp?.toDate().getTime();
    const now = new Date().getTime();
    const twoHours = 2 * 60 * 60 * 1000;

    if (now - msgTime > twoHours) {
      setError('Delete window expired (2 hours)');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
        isDeletedEveryone: true,
        content: 'This message was deleted'
      });

      // Log audit entry
      await addDoc(collection(db, 'audit_logs'), {
        action: 'delete_for_everyone',
        actorId: user.uid,
        targetId: messageId,
        chatId: chatId,
        timestamp: serverTimestamp(),
        details: `User ${user.uid} deleted message ${messageId} for everyone.`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, msgPath);
    }
  };

  const deleteChat = async () => {
    if (!user) return;
    const chatPath = `chats/${chatId}`;
    try {
      await deleteDoc(doc(db, 'chats', chatId));
      onBack();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, chatPath);
    }
  };

  const startLongPress = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      setActiveMessageId(id);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const endLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F0]">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
              {otherUser?.photoURL ? (
                <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-emerald-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">
                {otherUser?.displayName || 'Loading...'}
              </h3>
              <p className="text-[10px] text-emerald-600 font-medium">Online</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
            title="Delete Chat"
          >
            <Trash2 size={20} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <MoreVertical size={20} className="text-gray-400" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 py-2"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
                      <Trash2 size={18} />
                      Delete Chat
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Chat?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to delete this entire conversation? This action cannot be undone.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={deleteChat}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-3 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="sticky top-0 z-20 flex justify-center">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg"
            >
              {error}
            </motion.div>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          const isActive = activeMessageId === msg.id;

          return (
            <div 
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className="group relative max-w-[80%]"
                onMouseDown={() => startLongPress(msg.id)}
                onMouseUp={endLongPress}
                onMouseLeave={endLongPress}
                onTouchStart={() => startLongPress(msg.id)}
                onTouchEnd={endLongPress}
              >
                <div className={`
                  p-3 rounded-2xl text-sm shadow-sm transition-all
                  ${isMe 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none'}
                  ${msg.isDeletedEveryone ? 'italic opacity-60' : ''}
                  ${isActive ? 'scale-95 brightness-90' : ''}
                `}>
                  {msg.isDeletedEveryone ? (
                    <span>{msg.content}</span>
                  ) : msg.type === 'image' ? (
                    <img 
                      src={msg.content} 
                      alt="Shared photo" 
                      className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(msg.content, '_blank')}
                    />
                  ) : (
                    <span>{msg.content}</span>
                  )}
                  <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                    {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Message Actions Menu */}
                <AnimatePresence>
                  {isActive && (
                    <>
                      <div 
                        className="fixed inset-0 z-30" 
                        onClick={() => setActiveMessageId(null)}
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className={`
                          absolute bottom-full mb-2 ${isMe ? 'right-0' : 'left-0'} 
                          bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 w-40 z-40 overflow-hidden
                        `}
                      >
                        <button 
                          onClick={() => {
                            deleteForMe(msg.id);
                            setActiveMessageId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                          <Trash2 size={14} className="text-gray-400" />
                          Delete for me
                        </button>
                        {isMe && !msg.isDeletedEveryone && (
                          <button 
                            onClick={() => {
                              deleteForEveryone(msg.id, msg.timestamp);
                              setActiveMessageId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-gray-50"
                          >
                            <User size={14} />
                            Delete for everyone
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSendMessage} className="w-full p-3 sm:p-4 bg-white border-t border-gray-100 sticky bottom-0 z-20">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageSelect}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all flex items-center justify-center"
          >
            <ImageIcon size={22} />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-w-0"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { User, MessageSquare, Search, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../../utils/firestoreError';

interface Chat {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastUpdatedAt: any;
  otherUser?: {
    displayName: string;
    photoURL: string;
    email: string;
  };
}

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  onAddContact: () => void;
}

export default function ChatList({ onSelectChat, onAddContact }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const user = auth.currentUser;

  const handleDeleteConfirm = async () => {
    if (!user || !chatToDelete) return;
    
    const chatPath = `chats/${chatToDelete}`;
    try {
      await deleteDoc(doc(db, 'chats', chatToDelete));
      setChatToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, chatPath);
    }
  };

  const deleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChatToDelete(chatId);
  };

  useEffect(() => {
    if (!user) return;

    const chatsPath = 'chats';
    const q = query(
      collection(db, chatsPath),
      where('participantIds', 'array-contains', user.uid),
      orderBy('lastUpdatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const chatData: Chat[] = [];
        
        for (const chatDoc of snapshot.docs) {
          const data = chatDoc.data() as Chat;
          const otherUserId = data.participantIds.find(id => id !== user.uid);
          
          if (otherUserId) {
            const userPath = `users/${otherUserId}`;
            try {
              const userDoc = await getDoc(doc(db, 'users', otherUserId));
              if (userDoc.exists()) {
                data.otherUser = userDoc.data() as any;
              }
            } catch (err) {
              handleFirestoreError(err, OperationType.GET, userPath);
            }
          }
          
          chatData.push({ ...data, id: chatDoc.id });
        }
        
        setChats(chatData);
        setLoading(false);
      } catch (err) {
        // This catch is for errors inside the async loop
        console.error("Error processing chat snapshot:", err);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, chatsPath);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare size={32} />
            </div>
            <p className="text-gray-500">No conversations yet.</p>
            <button 
              onClick={onAddContact}
              className="mt-4 text-emerald-600 font-bold hover:underline"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left group cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectChat(chat.id);
                  }
                }}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {chat.otherUser?.photoURL ? (
                      <img src={chat.otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-emerald-600" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 truncate">
                      {chat.otherUser?.displayName || 'Unknown User'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {chat.lastUpdatedAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteChat(e, chat.id)}
                  className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete Chat"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {chatToDelete && (
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
                Are you sure you want to delete this conversation?
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDeleteConfirm}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setChatToDelete(null)}
                  className="w-full py-3 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

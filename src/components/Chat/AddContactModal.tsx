import React, { useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Search, UserPlus, User, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../../utils/firestoreError';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatStarted: (chatId: string) => void;
}

export default function AddContactModal({ isOpen, onClose, onChatStarted }: AddContactModalProps) {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [error, setError] = useState('');
  const currentUser = auth.currentUser;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !currentUser) return;
    if (email.toLowerCase() === currentUser.email?.toLowerCase()) {
      setError("You cannot add yourself.");
      return;
    }

    setSearching(true);
    setError('');
    setFoundUser(null);

    const usersPath = 'users';
    const searchEmail = email.trim();
    const searchEmailLower = searchEmail.toLowerCase();
    
    try {
      // Use 'in' to check both original and lowercase for backward compatibility
      const searchTerms = Array.from(new Set([searchEmail, searchEmailLower]));
      const q = query(collection(db, usersPath), where('email', 'in', searchTerms));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("User not found. Make sure the email is registered.");
      } else {
        setFoundUser({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, usersPath);
    } finally {
      setSearching(false);
    }
  };

  const startChat = async () => {
    if (!foundUser || !currentUser) return;

    const chatsPath = 'chats';
    try {
      // Check if chat already exists
      const q = query(
        collection(db, chatsPath),
        where('participantIds', 'array-contains', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      
      const existingChat = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.participantIds.includes(foundUser.uid);
      });

      if (existingChat) {
        onChatStarted(existingChat.id);
        onClose();
        return;
      }

      // Create new chat
      const newChat = {
        participantIds: [currentUser.uid, foundUser.uid],
        createdAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp(),
        lastMessage: ''
      };

      const docRef = await addDoc(collection(db, chatsPath), newChat);
      onChatStarted(docRef.id);
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, chatsPath);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
              <h2 className="text-xl font-bold">Start New Chat</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Enter registered Gmail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 transition-all"
                >
                  {searching ? 'Searching...' : 'Find User'}
                </button>
              </form>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl text-sm animate-shake">
                  <AlertCircle size={20} />
                  <p>{error}</p>
                </div>
              )}

              {foundUser && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-emerald-200">
                      {foundUser.photoURL ? (
                        <img src={foundUser.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{foundUser.displayName || 'User'}</h4>
                      <p className="text-xs text-gray-500">{foundUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={startChat}
                    className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
                  >
                    <UserPlus size={20} />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

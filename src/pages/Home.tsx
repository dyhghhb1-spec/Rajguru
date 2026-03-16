import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  Video, 
  Tv, 
  FileText, 
  PenTool, 
  ClipboardCheck, 
  BarChart3, 
  BookOpen, 
  Zap, 
  Newspaper, 
  HelpCircle, 
  MessageSquare, 
  Trophy,
  LogOut,
  User,
  Search,
  Library,
  X,
  Settings,
  Palette,
  Star,
  Share2,
  ShieldCheck,
  ChevronRight,
  Info,
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import ChatList from '../components/Chat/ChatList';
import ChatRoom from '../components/Chat/ChatRoom';
import AddContactModal from '../components/Chat/AddContactModal';

const menuItems = [
  { id: 'live', label: 'Live Classes', icon: Video, color: 'bg-red-50 text-red-600', emoji: '🎥' },
  { id: 'recorded', label: 'Recorded Classes', icon: Tv, color: 'bg-blue-50 text-blue-600', emoji: '📺' },
  { id: 'notes', label: 'Study Material', icon: FileText, color: 'bg-amber-50 text-amber-600', emoji: '📄' },
  { id: 'practice', label: 'Practice Questions', icon: PenTool, color: 'bg-emerald-50 text-emerald-600', emoji: '✍️' },
  { id: 'mock', label: 'Mock Tests', icon: ClipboardCheck, color: 'bg-purple-50 text-purple-600', emoji: '📝' },
  { id: 'analysis', label: 'Test Analysis', icon: BarChart3, color: 'bg-indigo-50 text-indigo-600', emoji: '📊' },
  { id: 'syllabus', label: 'Syllabus Tracker', icon: BookOpen, color: 'bg-orange-50 text-orange-600', emoji: '📚' },
  { id: 'quiz', label: 'Daily Quiz', icon: Zap, color: 'bg-yellow-50 text-yellow-600', emoji: '⚡' },
  { id: 'news', label: 'Current Affairs', icon: Newspaper, color: 'bg-cyan-50 text-cyan-600', emoji: '📰' },
  { id: 'doubt', label: 'Doubt Section', icon: HelpCircle, color: 'bg-rose-50 text-rose-600', emoji: '❓' },
  { id: 'community', label: 'Community', icon: MessageSquare, color: 'bg-teal-50 text-teal-600', emoji: '💬' },
  { id: 'rank', label: 'Leaderboard', icon: Trophy, color: 'bg-violet-50 text-violet-600', emoji: '🏆' },
];

const profileButtons = [
  { id: 'update', label: 'Update Profile', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'themes', label: 'Themes', icon: Palette, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'subscription', label: 'My Subscription', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'rate', label: 'Rate It', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'share', label: 'Share It', icon: Share2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { id: 'about', label: 'About Us', icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50' },
];

export default function Home() {
  const user = auth.currentUser;
  const [selectedItem, setSelectedItem] = useState<typeof menuItems[0] | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'tests' | 'library' | 'profile' | 'chat'>('home');
  const [activeProfileModal, setActiveProfileModal] = useState<string | null>(null);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setCurrentView('home');
        setSelectedChatId(null);
        setSelectedItem(null);
        setActiveProfileModal(null);
        setShowMaintenance(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  const triggerMaintenance = () => {
    setShowMaintenance(true);
    setMaintenanceCount(prev => {
      const next = prev + 1;
      if (next >= 3) {
        // Automatic logout after 3 attempts
        setTimeout(() => {
          signOut(auth);
        }, 1500);
      }
      return next;
    });
  };

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      {/* Welcome Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Hello, {user?.displayName?.split(' ')[0] || 'Learner'}! 👋
        </h2>
        <p className="text-gray-500 mt-1">What would you like to study today?</p>
      </section>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search classes, notes, tests..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        />
      </div>

      {/* 4x3 Grid of Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.id}
            onClick={triggerMaintenance}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <item.icon size={28} />
            </div>
            <span className="text-sm font-bold text-gray-800 leading-tight">{item.label}</span>
            <span className="text-xs text-gray-400 mt-1">{item.emoji}</span>
          </motion.button>
        ))}
      </div>

      {/* Banner Section */}
      <section className="mt-10">
        <div className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Upcoming Live Session</h3>
            <p className="text-emerald-50 opacity-90 mb-4 max-w-md">
              Join our expert faculty for a special session on "Advanced Mathematics" starting in 2 hours.
            </p>
            <button 
              onClick={triggerMaintenance}
              className="bg-white text-emerald-600 px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-50 transition-colors"
            >
              Set Reminder
            </button>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
            <Video size={200} />
          </div>
        </div>
      </section>
    </motion.div>
  );

  const renderProfile = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-emerald-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={48} className="text-emerald-600" />
              )}
            </div>
            <button 
              onClick={triggerMaintenance}
              className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full border-2 border-white shadow-md"
            >
              <PenTool size={14} />
            </button>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{user?.displayName || 'RajGuru Student'}</h3>
          <p className="text-gray-500 text-sm">{user?.email || user?.phoneNumber || 'learner@rajguru.com'}</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
        <div className="divide-y divide-gray-50">
          {profileButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                if (btn.id === 'privacy') {
                  setActiveProfileModal('privacy');
                } else {
                  triggerMaintenance();
                }
              }}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 ${btn.bg} ${btn.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <btn.icon size={20} />
                </div>
                <span className="font-bold text-gray-700">{btn.label}</span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-5 hover:bg-red-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <LogOut size={20} />
              </div>
              <span className="font-bold text-red-600">Logout</span>
            </div>
            <ChevronRight size={18} className="text-red-300" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderPlaceholder = (title: string) => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6">
        <Search size={40} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-xs">This section is currently under maintenance.</p>
      <button 
        onClick={triggerMaintenance}
        className="mt-8 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-100"
      >
        Back to Home
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div 
            onClick={triggerMaintenance}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img 
              src="https://i.postimg.cc/DzFPd0br/file-00000000f220720bb968d59e32963632.png" 
              alt="RajGuru Logo" 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-100 group-hover:scale-105 transition-transform"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">RajGuru</h1>
              <p className="text-xs text-gray-500">Coaching App</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            >
              <LogOut size={22} />
            </button>
            <div 
              onClick={triggerMaintenance}
              className={`w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 shadow-sm cursor-pointer transition-all ${currentView === 'profile' ? 'border-emerald-600 scale-110' : 'border-white'}`}
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-600">
                  <User size={20} />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'home' && renderHome()}
          {currentView === 'profile' && renderProfile()}
          {currentView === 'tests' && renderPlaceholder('Mock Tests')}
          {currentView === 'library' && renderPlaceholder('Digital Library')}
          {currentView === 'chat' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-50 bg-[#F5F5F0] flex flex-col"
            >
              {selectedChatId ? (
                <ChatRoom 
                  chatId={selectedChatId} 
                  onBack={() => setSelectedChatId(null)} 
                />
              ) : (
                <div className="flex flex-col h-full">
                  <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setCurrentView('home')}
                        className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                      >
                        <ArrowLeft size={20} className="text-gray-600" />
                      </button>
                      <h3 className="text-xl font-bold text-gray-900">Messages</h3>
                    </div>
                    <button 
                      onClick={() => setIsAddContactOpen(true)}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                    >
                      <User size={20} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ChatList 
                      onSelectChat={(id) => setSelectedChatId(id)} 
                      onAddContact={() => setIsAddContactOpen(true)} 
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AddContactModal 
        isOpen={isAddContactOpen} 
        onClose={() => setIsAddContactOpen(false)} 
        onChatStarted={(id) => {
          setSelectedChatId(id);
          setCurrentView('chat');
        }}
      />

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center md:hidden z-20">
        <button 
          onClick={triggerMaintenance}
          className={`flex flex-col items-center transition-colors ${currentView === 'home' ? 'text-emerald-600' : 'text-gray-400'}`}
        >
          <BookOpen size={24} />
          <span className="text-[10px] font-bold mt-1">Learn</span>
        </button>
        <button 
          onClick={triggerMaintenance}
          className={`flex flex-col items-center transition-colors ${currentView === 'tests' ? 'text-emerald-600' : 'text-gray-400'}`}
        >
          <ClipboardCheck size={24} />
          <span className="text-[10px] font-bold mt-1">Tests</span>
        </button>
        <button 
          onClick={triggerMaintenance}
          className={`flex flex-col items-center transition-colors ${currentView === 'library' ? 'text-emerald-600' : 'text-gray-400'}`}
        >
          <Library size={24} />
          <span className="text-[10px] font-bold mt-1">Library</span>
        </button>
        <button 
          onClick={() => setCurrentView('profile')}
          className={`flex flex-col items-center transition-colors ${currentView === 'profile' ? 'text-emerald-600' : 'text-gray-400'}`}
        >
          <User size={24} />
          <span className="text-[10px] font-bold mt-1">Profile</span>
        </button>
      </nav>

      {/* Maintenance Modal */}
      <AnimatePresence>
        {showMaintenance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMaintenance(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <HelpCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">असुविधा के लिए खेद है</h3>
              <p className="text-gray-600 leading-relaxed mb-8">
                वर्तमान में हमारे सर्वर पर तकनीकी सुधार और रखरखाव (maintenance) का कार्य चल रहा है। हम बहुत जल्द इस सेवा को पुनः सक्रिय करेंगे। आपके धैर्य और सहयोग के लिए धन्यवाद।
              </p>
              <button 
                onClick={() => setShowMaintenance(false)}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
              >
                ठीक है (OK)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile/Action Modal */}
      <AnimatePresence>
        {activeProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveProfileModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex flex-col h-full max-h-[80vh]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Privacy Policy</h3>
                  </div>
                  <button 
                    onClick={() => setActiveProfileModal(null)}
                    className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-4 space-y-6 text-gray-600 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  <p className="font-medium text-gray-900">Effective Date: March 13, 2026</p>
                  
                  <p>
                    RajGuru ("we", "our", or "us") operates the RajGuru mobile application and related services. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our mobile application and services. Please read this policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the application.
                  </p>
                  
                  <p>
                    We respect your privacy and are committed to protecting the personal information of our users. By using the RajGuru application, you consent to the collection and use of your information in accordance with this Privacy Policy.
                  </p>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">1. Information We Collect</h4>
                    <p className="mb-2">We may collect information about you in a variety of ways when you use the RajGuru app. The information we may collect includes:</p>
                    <div className="ml-4 space-y-2">
                      <p className="font-semibold text-gray-800">Personal Information</p>
                      <p>When you register or use our application, we may collect personally identifiable information such as Name, Email address, Mobile phone number, Profile photo, Educational details, Username or login credentials. This information is used to create and manage your user account.</p>
                      
                      <p className="font-semibold text-gray-800">Usage Data</p>
                      <p>We may also collect information about how the application is accessed and used. This data may include Device type, Operating system, IP address, App usage statistics, Time spent on different sections, Crash logs and diagnostic data. This information helps us improve the performance and functionality of our application.</p>
                      
                      <p className="font-semibold text-gray-800">Educational Information</p>
                      <p>Since RajGuru is an educational platform, we may collect data related to your learning progress such as Test scores, Quiz results, Study progress, Syllabus tracking information, Course enrollments. This information helps us provide personalized learning experiences.</p>
                    </div>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">2. How We Use Your Information</h4>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>To create and manage user accounts</li>
                      <li>To provide access to courses, study materials, and tests</li>
                      <li>To track academic progress and performance</li>
                      <li>To improve our services and app functionality</li>
                      <li>To personalize the learning experience</li>
                      <li>To send notifications related to courses, updates, and announcements</li>
                      <li>To respond to user inquiries and provide customer support</li>
                      <li>To maintain security and prevent fraudulent activities</li>
                    </ul>
                    <p className="mt-2 italic">We only use your information for legitimate educational and service-related purposes.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">3. Sharing of Information</h4>
                    <p>We do not sell, trade, or rent users’ personal information to third parties. However, we may share information in the following circumstances:</p>
                    <div className="ml-4 mt-2">
                      <p className="font-semibold text-gray-800">Service Providers</p>
                      <p>We may share your information with third-party service providers that help us operate the app, such as Cloud storage providers, Analytics services, Payment gateways, Notification services. These providers are obligated to keep your information secure and confidential.</p>
                      <p className="font-semibold text-gray-800 mt-2">Legal Requirements</p>
                      <p>We may disclose your information if required by law or if we believe such action is necessary to comply with legal obligations, protect and defend our rights, prevent fraud or security threats, or protect the safety of users.</p>
                    </div>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">4. Data Security</h4>
                    <p>We take appropriate security measures to protect your personal information. These measures include secure servers, encryption technologies, restricted access to personal data, and regular security monitoring.</p>
                    <p className="mt-2">While we strive to use commercially acceptable means to protect your data, no method of electronic storage or internet transmission is completely secure. Therefore, we cannot guarantee absolute security.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">5. Children's Privacy</h4>
                    <p>RajGuru is primarily designed for students preparing for academic and competitive examinations. We do not knowingly collect personal information from children under the age of 13 without parental consent.</p>
                    <p className="mt-2">If we become aware that we have collected personal information from a child without verification of parental consent, we will take steps to remove that information from our servers.</p>
                    
                    <div className="my-4">
                      <button 
                        onClick={() => {
                          setActiveProfileModal(null);
                          setCurrentView('chat');
                        }}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors shadow-md"
                      >
                        FAQ's
                      </button>
                    </div>
                    
                    <p>Parents or guardians who believe that their child has provided personal information to us without consent may contact us.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">6. User Accounts and Responsibilities</h4>
                    <p>Users are responsible for maintaining the confidentiality of their login credentials. You agree to provide accurate and complete information, keep your password secure, and notify us immediately of unauthorized account access.</p>
                    <p className="mt-2">RajGuru is not responsible for any loss resulting from unauthorized use of your account due to negligence in protecting login credentials.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">7. Cookies and Tracking Technologies</h4>
                    <p>RajGuru may use cookies and similar technologies to enhance user experience. These technologies help us understand user behavior, improve app performance, and provide personalized content.</p>
                    <p className="mt-2">Users can disable cookies through their device settings, although some features of the app may not function properly without them.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">8. Third-Party Links and Services</h4>
                    <p>Our application may contain links to third-party websites or services such as video hosting platforms, payment gateways, and educational resources. We are not responsible for the privacy practices or content of these external services. We encourage users to review the privacy policies of any third-party services they access through our platform.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">9. Data Retention</h4>
                    <p>We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy. This includes maintaining user accounts, providing educational services, complying with legal obligations, and resolving disputes. When data is no longer needed, we securely delete or anonymize it.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">10. Your Privacy Rights</h4>
                    <p>As a user of RajGuru, you have certain rights regarding your personal data. These may include accessing the personal data we hold about you, requesting correction of inaccurate information, requesting deletion of your account and personal data, and opting out of certain communications.</p>
                    <p className="mt-2">To exercise these rights, you may contact us through the contact information provided below.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">11. Changes to This Privacy Policy</h4>
                    <p>We may update this Privacy Policy from time to time to reflect changes in our services, technology, or legal requirements. When we update the policy, we will revise the "Effective Date" at the top of this page. Users are encouraged to review this Privacy Policy periodically to stay informed about how we protect their information.</p>
                    <p className="mt-2">Continued use of the RajGuru app after any changes indicates acceptance of the updated policy.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">12. Community Guidelines and User Conduct</h4>
                    <p>RajGuru may include community features such as discussions, comments, and doubt forums. Users are expected to maintain respectful behavior. The following actions are strictly prohibited: Use of abusive or offensive language, Posting obscene or inappropriate content, Discrimination based on caste, religion, gender, or community, Spamming or advertising unrelated content.</p>
                    <p className="mt-2">We reserve the right to remove content or suspend accounts that violate these guidelines.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">13. Contact Us</h4>
                    <p>If you have any questions about this Privacy Policy or our data practices, you may contact us at:</p>
                    <div className="mt-2 p-4 bg-gray-50 rounded-2xl space-y-1">
                      <p><span className="font-semibold">App Name:</span> RajGuru</p>
                      <p><span className="font-semibold">Email:</span> support@rajguru.com</p>
                      <p><span className="font-semibold">Support:</span> help.rajguru.com</p>
                    </div>
                  </section>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button 
                    onClick={() => setActiveProfileModal(null)}
                    className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                  >
                    I Understand
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}




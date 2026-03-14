import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Login from './pages/Login';
import Home from './pages/Home';
import { motion, AnimatePresence } from 'motion/react';
import ErrorBoundary from './components/ErrorBoundary';
import { useEffect } from 'react';

function VisibilityHandler() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  useEffect(() => {
    const handleVisibilityChange = () => {
      // When the app becomes visible again (user returns to app)
      if (document.visibilityState === 'visible' && user) {
        // Force navigation to home page
        navigate('/', { replace: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [navigate, user]);

  return null;
}

export default function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <motion.img 
            src="https://i.postimg.cc/DzFPd0br/file-00000000f220720bb968d59e32963632.png"
            alt="Logo"
            referrerPolicy="no-referrer"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 mx-auto mb-4 rounded-2xl shadow-lg"
          />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <VisibilityHandler />
        <AnimatePresence mode="wait">
          <Routes>
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to="/" />} 
            />
            <Route 
              path="/" 
              element={user ? <Home /> : <Navigate to="/login" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </Router>
    </ErrorBoundary>
  );
}

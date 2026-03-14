import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Smartphone, Chrome, UserPlus, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [verificationId, setVerificationId] = useState<any>(null);
  const [error, setError] = useState('');
  const [showMaintenance, setShowMaintenance] = useState(false);
  const navigate = useNavigate();

  const saveUserProfile = async (user: any) => {
    const userPath = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: user.displayName || email.split('@')[0],
        email: user.email?.toLowerCase() || '',
        photoURL: user.photoURL || '',
        role: 'student',
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userPath);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      await saveUserProfile(userCredential.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = () => {
    setShowMaintenance(true);
  };

  const verifyOtp = async () => {
    try {
      await verificationId.confirm(otp);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-black/5"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <img 
              src="https://i.postimg.cc/DzFPd0br/file-00000000f220720bb968d59e32963632.png" 
              alt="RajGuru Logo" 
              referrerPolicy="no-referrer"
              className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg border-2 border-emerald-50"
            />
            <h1 className="text-3xl font-bold text-gray-900">RajGuru</h1>
            <p className="text-gray-500 mt-2">Empowering your learning journey</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100">
              {error}
            </div>
          )}

          {!showPhoneLogin ? (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
              >
                {isRegistering ? <UserPlus size={20} /> : <LogIn size={20} />}
                {isRegistering ? 'Create Account' : 'Sign In'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {!verificationId ? (
                <>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setShowMaintenance(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-100"
                  >
                    Send OTP
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <button
                    onClick={verifyOtp}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-100"
                  >
                    Verify & Login
                  </button>
                </>
              )}
              <div id="recaptcha-container"></div>
            </div>
          )}

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700"
            >
              <Chrome size={20} className="text-red-500" />
              Google
            </button>
            <button
              onClick={() => {
                if (showPhoneLogin) {
                  setShowPhoneLogin(false);
                } else {
                  setShowMaintenance(true);
                }
              }}
              className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700"
            >
              <Smartphone size={20} className="text-emerald-600" />
              {showPhoneLogin ? 'Email' : 'Phone'}
            </button>
          </div>

        </div>
      </motion.div>

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
    </div>
  );
}

import React, { useState } from "react";
import { 
  Sparkles, Mail, User, Lock, ArrowLeft, CheckCircle, 
  AlertCircle, Bookmark, Star, LayoutDashboard, RefreshCw, 
  BookOpen, ShieldCheck, Heart, LogIn, Moon, Flame
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendEmailVerification
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { getTranslation } from "../lib/translations";

interface WelcomeScreenProps {
  onContinueAsGuest: () => void;
  onLoginSuccess: () => void;
  language?: "en" | "ur" | "ar";
}

export default function WelcomeScreen({ 
  onContinueAsGuest, 
  onLoginSuccess,
  language = "en" 
}: WelcomeScreenProps) {
  const [mode, setMode] = useState<"welcome" | "login" | "register" | "forgot">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [parentName, setParentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setInfoMessage("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccessState(true);
      setTimeout(() => {
        onLoginSuccess();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill out both email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccessState(true);
      setTimeout(() => {
        onLoginSuccess();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in. Please check your credentials.");
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !parentName) {
      setError("Please fill out all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        try {
          await sendEmailVerification(userCredential.user);
        } catch (e) {
          console.warn("Could not send verification email", e);
        }
        setInfoMessage("Account created! Redirecting to homepage...");
        setSuccessState(true);
        setTimeout(() => {
          onLoginSuccess();
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMessage("Password reset email sent! Check your inbox.");
      setMode("login");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  const isRTL = language === "ur" || language === "ar";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-slate-100 overflow-y-auto selection:bg-emerald-500 selection:text-white"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* BACKGROUND DECORATIONS: Floating Lanterns, Mosque Silhouettes & Twinkling Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Ambient Radial Glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-[450px] h-[450px] bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-[400px] h-[400px] bg-amber-500/15 rounded-full blur-3xl" />

        {/* Floating Stars */}
        <motion.div 
          animate={{ y: [0, -15, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-12 left-10 text-amber-300/60 text-xl"
        >
          ✦
        </motion.div>
        <motion.div 
          animate={{ y: [0, 12, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-24 right-16 text-amber-200/50 text-2xl"
        >
          ★
        </motion.div>
        <motion.div 
          animate={{ y: [0, -10, 0], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-28 left-20 text-emerald-300/40 text-lg"
        >
          ✦
        </motion.div>
        <motion.div 
          animate={{ y: [0, -18, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-1/2 right-12 text-teal-200/60 text-xl"
        >
          ★
        </motion.div>

        {/* Floating Lanterns */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-8 left-8 sm:left-16 opacity-70"
        >
          <div className="relative flex flex-col items-center">
            <div className="w-0.5 h-16 bg-gradient-to-b from-amber-400/40 to-amber-400" />
            <div className="w-8 h-12 bg-amber-400/20 border border-amber-300/60 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.4)] flex items-center justify-center backdrop-blur-xs">
              <div className="w-3 h-5 bg-amber-300/80 rounded-full animate-ping" />
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, -16, 0], rotate: [2, -2, 2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute top-12 right-10 sm:right-20 opacity-70"
        >
          <div className="relative flex flex-col items-center">
            <div className="w-0.5 h-20 bg-gradient-to-b from-amber-400/40 to-amber-400" />
            <div className="w-9 h-14 bg-amber-400/20 border border-amber-300/60 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.5)] flex items-center justify-center backdrop-blur-xs">
              <div className="w-3.5 h-6 bg-amber-300/90 rounded-full animate-pulse" />
            </div>
          </div>
        </motion.div>

        {/* Subtle Mosque Silhouette at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-15 flex justify-center items-end pointer-events-none">
          <svg viewBox="0 0 1200 120" className="w-full h-full fill-emerald-300" preserveAspectRatio="none">
            <path d="M0,120 L0,90 Q100,70 200,90 T400,90 Q450,20 500,90 Q550,10 600,0 Q650,10 700,90 Q750,20 800,90 T1000,90 Q1100,70 1200,90 L1200,120 Z" />
          </svg>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={successState ? { opacity: 0, scale: 0.9, y: -20 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-4xl my-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* LEFT SIDE: BRAND & HERO BANNER */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            
            {/* Top Brand Badges */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
              <span>{getTranslation("byAuthor", language)}</span>
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span className="text-amber-300 font-extrabold">{getTranslation("tagline", language)}</span>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                📖 {getTranslation("appName", language)}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
                {getTranslation("heroSubtitle", language)}
              </p>
            </div>

            {/* Unlocked Benefits Banner */}
            <div className="pt-2">
              <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl text-left">
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 mb-3">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  Logged-in users unlock:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-200">
                  <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-xl">
                    <span className="text-amber-300 font-bold">⭐</span>
                    <span className="font-semibold">{getTranslation("bookmarks", language)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-xl">
                    <span className="text-amber-300 font-bold">⭐</span>
                    <span className="font-semibold">{getTranslation("progress", language)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-xl">
                    <span className="text-amber-300 font-bold">⭐</span>
                    <span className="font-semibold">{getTranslation("achievements", language)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-xl">
                    <span className="text-amber-300 font-bold">⭐</span>
                    <span className="font-semibold">{getTranslation("parentDashboard", language)}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2 bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-xl justify-center sm:justify-start">
                    <span className="text-amber-300 font-bold">⭐</span>
                    <span className="font-semibold">Sync across all devices</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE: GLASSMORPHISM CARD */}
          <div className="lg:col-span-6">
            <div className="relative bg-slate-900/75 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
              
              {/* Card Ambient Glows */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

              {/* Status Notifications */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </motion.div>
              )}

              {infoMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{infoMessage}</span>
                </motion.div>
              )}

              {/* Loading Spinner overlay when signing in */}
              {loading && (
                <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-emerald-300 animate-pulse">
                    Connecting to Ummah Kids...
                  </p>
                </div>
              )}

              {/* MODE 1: WELCOME MAIN SCREEN */}
              {mode === "welcome" && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-5"
                >
                  <div className="text-center sm:text-left space-y-1">
                    <h2 className="text-xl font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      Welcome! Welcome!
                    </h2>
                    <p className="text-xs text-slate-400">
                      Choose how you would like to proceed:
                    </p>
                  </div>

                  {/* MAIN ACTION BUTTONS */}
                  <div className="space-y-3 pt-1">
                    {/* Google Button */}
                    <button
                      onClick={handleGoogleLogin}
                      type="button"
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-800 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer active:scale-98 group"
                    >
                      <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5.04c1.84 0 3.51.63 4.81 1.88l3.6-3.6C18.23 1.34 15.34.5 12 .5 7.33.5 3.39 3.19 1.5 7.12l4.13 3.2C6.5 7.54 9 5.04 12 5.04z" />
                        <path fill="#4285F4" d="M23.49 12.27c0-.84-.07-1.65-.21-2.43H12v4.61h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.71 2.88c2.17-2 3.72-4.94 3.72-8.64z" />
                        <path fill="#FBBC05" d="M5.63 14.88a7.07 7.07 0 0 1 0-4.76l-4.13-3.2a11.96 11.96 0 0 0 0 11.16l4.13-3.2z" />
                        <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.08 7.96-2.91l-3.71-2.88c-1.03.69-2.35 1.1-4.25 1.1-3 0-5.5-2.5-6.38-5.28l-4.13 3.2c1.89 3.93 5.83 6.67 10.5 6.67z" />
                      </svg>
                      <span>🟢 Continue with Google</span>
                    </button>

                    {/* Email Button */}
                    <button
                      onClick={() => setMode("login")}
                      type="button"
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-98 group"
                    >
                      <Mail className="w-5 h-5 shrink-0 text-emerald-200 group-hover:scale-110 transition-transform" />
                      <span>📧 {getTranslation("continueWithEmail", language)}</span>
                    </button>

                    {/* Guest Button */}
                    <button
                      onClick={onContinueAsGuest}
                      type="button"
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer active:scale-98 group"
                    >
                      <User className="w-5 h-5 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" />
                      <span>👤 {getTranslation("continueGuest", language)}</span>
                    </button>
                  </div>

                  {/* Below Buttons Navigation */}
                  <div className="pt-2 border-t border-slate-800/80 text-center space-y-1.5 text-xs text-slate-400">
                    <div>
                      {language === "ur" ? "پہلے سے اکاؤنٹ ہے؟ " : language === "ar" ? "لديك حساب بالفعل؟ " : "Already have an account? "}
                      <button 
                        onClick={() => setMode("login")}
                        className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer mx-1"
                      >
                        {getTranslation("login", language)}
                      </button>
                    </div>
                    <div>
                      {language === "ur" ? "نیا اکاؤنٹ بنائیں؟ " : language === "ar" ? "مستخدم جديد؟ " : "New user? "}
                      <button 
                        onClick={() => setMode("register")}
                        className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer mx-1"
                      >
                        {getTranslation("createAccount", language)}
                      </button>
                    </div>
                  </div>

                  {/* Bottom Note */}
                  <div className="text-[11px] text-center text-slate-500 pt-1">
                    Guest users can browse stories and Quran. Logged-in accounts sync progress across devices.
                  </div>
                </motion.div>
              )}

              {/* MODE 2: EMAIL LOGIN */}
              {mode === "login" && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleEmailLogin}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <button
                      type="button"
                      onClick={() => setMode("welcome")}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <h3 className="text-sm font-extrabold text-white">Sign In with Email</h3>
                    <div className="w-8" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="parent@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-[10px] text-emerald-400 hover:underline font-bold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>

                  <div className="text-center pt-2 text-xs text-slate-400">
                    New user?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Create Account
                    </button>
                  </div>
                </motion.form>
              )}

              {/* MODE 3: CREATE ACCOUNT */}
              {mode === "register" && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleEmailRegister}
                  className="space-y-3.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <button
                      type="button"
                      onClick={() => setMode("welcome")}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <h3 className="text-sm font-extrabold text-white">Create New Account</h3>
                    <div className="w-8" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parent / Guardian Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="e.g. Abdullah Khan"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="parent@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Create Account</span>
                  </button>

                  <div className="text-center pt-1 text-xs text-slate-400">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </motion.form>
              )}

              {/* MODE 4: FORGOT PASSWORD */}
              {mode === "forgot" && (
                <motion.form
                  key="forgot"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleForgotPassword}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Sign In
                    </button>
                    <h3 className="text-sm font-extrabold text-white">Reset Password</h3>
                    <div className="w-8" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="parent@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>Send Password Reset Link</span>
                  </button>
                </motion.form>
              )}

            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

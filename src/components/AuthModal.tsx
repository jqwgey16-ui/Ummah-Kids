import React, { useState } from "react";
import { 
  X, Mail, Lock, User, Sparkles, LogIn, AlertCircle, CheckCircle, ShieldAlert 
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

interface AuthModalProps {
  onClose: () => void;
  language: "en" | "ur" | "ar";
}

export default function AuthModal({ onClose, language }: AuthModalProps) {
  const [view, setView] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [parentName, setParentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill out all fields");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !parentName) {
      setError("Please fill out all fields");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        // Send verification email
        await sendEmailVerification(userCredential.user);
        setSuccessMsg("Account created! A verification email has been sent. Please check your inbox before logging in.");
        setView("login");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to register.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("Password reset email sent successfully! Please check your inbox.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const isRTL = language === "ur" || language === "ar";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
      >
        {/* Background decorative lights */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-slate-500 dark:text-slate-300" />
        </button>

        {/* Logo/Header */}
        <div className="text-center mb-6 space-y-1">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            {view === "login" && (language === "ur" ? "لاگ ان کریں" : language === "ar" ? "تسجيل الدخول" : "Parent Portal Log In")}
            {view === "register" && (language === "ur" ? "نیا اکاؤنٹ بنائیں" : language === "ar" ? "إنشاء حساب" : "Create Parent Account")}
            {view === "forgot" && (language === "ur" ? "پاس ورڈ بھول گئے؟" : language === "ar" ? "نسيت كلمة المرور" : "Reset Password")}
          </h3>
          <p className="text-xs text-slate-400">
            {language === "ur" ? "محفوظ اسلامی سیکھنے کا ہوم" : language === "ar" ? "بوابة الإشراف العائلي الآمنة" : "Secured Parental Control Suite"}
          </p>
        </div>

        {/* Alert Logs */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* Forms Rendering */}
        <AnimatePresence mode="wait">
          {view === "login" && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-[10px] text-emerald-600 hover:underline font-bold"
                  >
                    {language === "ur" ? "پاس ورڈ بھول گئے؟" : language === "ar" ? "نسيت كلمة المرور؟" : "Forgot?"}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <LogIn className="w-4 h-4" /> {loading ? "Signing In..." : "Sign In"}
              </button>
            </motion.form>
          )}

          {view === "register" && (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Parent's Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Abdullah Khan"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                {loading ? "Registering Account..." : "Create Account"}
              </button>
            </motion.form>
          )}

          {view === "forgot" && (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleForgotPassword}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Registered Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                {loading ? "Sending reset email..." : "Send Reset Link"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Divider & Social Logs */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/60 dark:border-slate-700" /></div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase"><span className="px-3 bg-white dark:bg-slate-800 text-slate-400">Or Continue With</span></div>
        </div>

        {/* Google Login button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-250 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.84 0 3.51.63 4.81 1.88l3.6-3.6C18.23 1.34 15.34.5 12 .5 7.33.5 3.39 3.19 1.5 7.12l4.13 3.2C6.5 7.54 9 5.04 12 5.04z" />
            <path fill="#4285F4" d="M23.49 12.27c0-.84-.07-1.65-.21-2.43H12v4.61h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.71 2.88c2.17-2 3.72-4.94 3.72-8.64z" />
            <path fill="#FBBC05" d="M5.63 14.88a7.07 7.07 0 0 1 0-4.76l-4.13-3.2a11.96 11.96 0 0 0 0 11.16l4.13-3.2z" />
            <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.08 7.96-2.91l-3.71-2.88c-1.03.69-2.35 1.1-4.25 1.1-3 0-5.5-2.5-6.38-5.28l-4.13 3.2c1.89 3.93 5.83 6.67 10.5 6.67z" />
          </svg>
          Google Login
        </button>

        {/* Form Toggles */}
        <div className="text-center mt-6 text-xs text-slate-500 font-medium">
          {view === "login" ? (
            <>
              Don't have an account?{" "}
              <button onClick={() => setView("register")} className="text-emerald-600 font-bold hover:underline">
                Register here
              </button>
            </>
          ) : (
            <>
              Already have a parent account?{" "}
              <button onClick={() => setView("login")} className="text-emerald-600 font-bold hover:underline">
                Log In
              </button>
            </>
          )}
        </div>

      </motion.div>
    </div>
  );
}

import React, { useState } from "react";
import { Mail, Phone, MapPin, Heart, Send, CheckCircle2, Shield, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Language, getTranslation } from "../lib/translations";

interface AboutContactProps {
  language?: Language;
}

export default function AboutContact({ language = "en" }: AboutContactProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !msg) return;
    setSent(true);
    setTimeout(() => {
      setName("");
      setEmail("");
      setMsg("");
      setSent(false);
    }, 4000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4" id="about-contact-view">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        
        {/* About Column */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {getTranslation("about", language)} {getTranslation("appName", language)}
            </h2>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              {getTranslation("byAuthor", language)} • {getTranslation("tagline", language)}
            </p>
          </div>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            {getTranslation("heroSubtitle", language)}
          </p>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            {language === "ur" 
              ? "ہمارا مقصد بچوں کے دلوں میں اخلاقی اقدار، اللہ تعالیٰ، انبیاء کرام اور صحابہ کرام رض کی محبت پیدا کرنا ہے۔ انگریزی، اردو اور عربی میں کہانیوں اور تعلیم کے ذریعے ہم بچوں کو ایک محفوظ ماحول فراہم کرتے ہیں۔"
              : language === "ar"
              ? "مهمتنا هي تغذية القيم الأخلاقية العالية والمحبة العميقة لله سبحانه وتعالى وأنبيائه والصحابة الكرام في قلوب الأطفال من خلال منصة تعليمية إسلامية آمنة وممتعة."
              : "Our mission is to nurture strong moral values and a deep love for Allah, His Prophets, and the Sahaba (companions) in the hearts of children. By providing content side-by-side in English, Urdu, and Arabic, we help children improve their vocabulary and comprehension while bonding with their families."}
          </p>

          {/* Key pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-emerald-500/5 border border-emerald-100 dark:border-emerald-950 p-4 rounded-2xl flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">100% Authentic</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Every story is derived from verified Quranic verses and authentic Hadith books with citations.</p>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-100 dark:border-amber-950 p-4 rounded-2xl flex items-start gap-3">
              <EyeOff className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Ad-Free & Safe</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Strictly clean environment. No pop-up advertisements, external trackers, or background noise.</p>
              </div>
            </div>
          </div>

          {/* Vision citation banner */}
          <div className="p-5 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-3xl text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
              <Heart className="w-40 h-40" />
            </div>
            <h4 className="text-sm font-bold flex items-center gap-1.5 mb-2">
              <Heart className="w-4 h-4 fill-current animate-pulse text-amber-300" />
              A Message from Inaamullah
            </h4>
            <p className="text-xs leading-relaxed italic text-emerald-50">
              "We hope these stories serve as warm light in our children's hearts, teaching them patience, kindness, integrity, and faith in their Creator. Let's build a beautiful future, one story at a time."
            </p>
          </div>
        </div>

        {/* Contact form Column */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 sm:p-8 rounded-3xl shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Get in Touch
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Have story suggestions or feedback? Send us a letter!
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.form
                key="contact-form"
                onSubmit={handleSubmit}
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Your Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                    placeholder="Write your story suggestions, comments, or kind regards here..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  id="contact-submit"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mx-auto">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Message Sent!
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Jazakallah Khair for reaching out! We have received your query and will reply to your email soon.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

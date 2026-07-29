import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, Moon, Sun, Search, Menu, X, Sparkles, ShieldAlert, Heart, Video,
  Shield, Users, User, LogIn, LogOut, ChevronDown, Globe, Award, Flame, Bell,
  Printer, Download, Palette, Brush, Trash2, CheckCircle, Trophy, Sparkle, Settings, Home
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Language, getTranslation } from "../lib/translations";
import { KidProfile } from "../types";

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isAdmin: boolean;
  bookmarkCount?: number;
  
  // Platform Additions
  language: Language;
  onLanguageChange: (lang: Language) => void;
  parentUser: any;
  activeKidProfile: KidProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenDashboard: () => void;
  onOpenKidProfiles: () => void;
  onStartTour?: () => void;
}

export default function Header({
  currentView,
  onNavigate,
  onSearch,
  searchQuery,
  darkMode,
  toggleDarkMode,
  isAdmin,
  bookmarkCount = 0,
  
  language,
  onLanguageChange,
  parentUser,
  activeKidProfile,
  onOpenAuth,
  onLogout,
  onOpenDashboard,
  onOpenKidProfiles,
  onStartTour
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Custom states for premium features
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showLearnMenu, setShowLearnMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Modals for premium sub-applications
  const [activeModal, setActiveModal] = useState<"none" | "coloring" | "worksheets" | "rewards">("none");

  // Coloring Canvas States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#10b981"); // Emerald default
  const [brushSize, setBrushSize] = useState(8);
  const [selectedSketch, setSelectedSketch] = useState<"mosque" | "moon" | "quran" | "camel">("mosque");

  // Worksheet Print Selection State
  const [selectedWorksheet, setSelectedWorksheet] = useState<"arabic" | "salah" | "duas" | "story">("arabic");

  // References for clicks outside
  const learnRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);

  const isRTL = language === "ur" || language === "ar";

  // Notifications List
  const notifications = [
    {
      id: 1,
      title: "🌟 Level Up Your Wisdom!",
      text: "Read stories and complete interactive quizzes to earn rare badges!",
      time: "Just now",
      icon: Trophy,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
    },
    {
      id: 2,
      title: "📖 Daily Quran Tip",
      text: "Read Surah Al-Fatihah with your parents tonight to bless your day!",
      time: "2 hours ago",
      icon: BookOpen,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
    },
    {
      id: 3,
      title: "🕌 Salah Challenge",
      text: "Learn the proper bowing (Ruku) step inside the Salah Cabin today!",
      time: "1 day ago",
      icon: Flame,
      color: "text-orange-500 bg-orange-50 dark:bg-orange-950/40"
    }
  ];

  // Primary menu items (Desktop row)
  const primaryNavItems = [
    { id: "home", key: "home" },
    { id: "stories", key: "allStories" },
    { id: "videos", key: "islamicVideos" },
    { id: "teacher", key: "aiTeacher" },
  ];

  // Learn dropdown options
  const learnItems = [
    { id: "quran", key: "quranReader", emoji: "📖" },
    { id: "salah", key: "salahGuide", emoji: "🕌" },
    { id: "duas", key: "dailyDuas", emoji: "🌱" },
    { id: "hadiths", key: "hadithSection", emoji: "🌸" },
    { id: "games", key: "games", emoji: "🎮" },
    { id: "quiz-challenge", key: "quizChallenge", emoji: "🏆" },
    { id: "coloring", key: "coloringPages", emoji: "🎨" },
    { id: "worksheets", key: "printableWorksheets", emoji: "🖨️" },
    { id: "scholar", key: "askScholar", emoji: "🎓" },
  ];

  // Colors available in kid coloring studio
  const paletteColors = [
    { name: "Emerald", hex: "#10b981" },
    { name: "Amber", hex: "#f59e0b" },
    { name: "Gold", hex: "#eab308" },
    { name: "Ruby", hex: "#ef4444" },
    { name: "Sky Blue", hex: "#0ea5e9" },
    { name: "Purple", hex: "#8b5cf6" },
    { name: "Pink", hex: "#ec4899" },
    { name: "Orange", hex: "#f97316" },
    { name: "Brown", hex: "#78350f" },
    { name: "Black", hex: "#1e293b" },
    { name: "White (Eraser)", hex: "#ffffff" }
  ];

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (learnRef.current && !learnRef.current.contains(event.target as Node)) {
        setShowLearnMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Drawing outline shapes in coloring studio canvas
  const drawOutline = (ctx: CanvasRenderingContext2D, type: string, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = darkMode ? "#64748b" : "#94a3b8";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (type === "mosque") {
      // Dome
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.52, width * 0.16, Math.PI, 2 * Math.PI);
      ctx.stroke();

      // Crescent peak
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.32, 8, 0, Math.PI * 1.5);
      ctx.stroke();

      // Main structure
      ctx.strokeRect(width * 0.28, height * 0.52, width * 0.44, height * 0.33);

      // Left Minaret
      ctx.strokeRect(width * 0.18, height * 0.35, width * 0.08, height * 0.5);
      ctx.beginPath();
      ctx.moveTo(width * 0.18, height * 0.35);
      ctx.lineTo(width * 0.22, height * 0.24);
      ctx.lineTo(width * 0.26, height * 0.35);
      ctx.closePath();
      ctx.stroke();

      // Right Minaret
      ctx.strokeRect(width * 0.74, height * 0.35, width * 0.08, height * 0.5);
      ctx.beginPath();
      ctx.moveTo(width * 0.74, height * 0.35);
      ctx.lineTo(width * 0.78, height * 0.24);
      ctx.lineTo(width * 0.82, height * 0.35);
      ctx.closePath();
      ctx.stroke();

      // Large arch door
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.85, width * 0.08, Math.PI, 2 * Math.PI);
      ctx.stroke();
    } else if (type === "moon") {
      // Large crescent moon
      ctx.beginPath();
      ctx.arc(width * 0.45, height * 0.5, width * 0.25, Math.PI * 0.4, Math.PI * 1.6);
      ctx.arc(width * 0.52, height * 0.5, width * 0.22, Math.PI * 1.5, Math.PI * 0.5, true);
      ctx.closePath();
      ctx.stroke();

      // Shining Star
      ctx.beginPath();
      const cx = width * 0.65;
      const cy = height * 0.4;
      const spikes = 5;
      const outerRadius = 24;
      const innerRadius = 10;
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.stroke();
    } else if (type === "quran") {
      // Open book layout
      const cy = height * 0.5;
      const cx = width * 0.5;

      // Left page
      ctx.beginPath();
      ctx.moveTo(cx, cy + 80);
      ctx.quadraticCurveTo(cx - 100, cy + 110, cx - 180, cy + 80);
      ctx.lineTo(cx - 180, cy - 80);
      ctx.quadraticCurveTo(cx - 100, cy - 50, cx, cy - 80);
      ctx.closePath();
      ctx.stroke();

      // Right page
      ctx.beginPath();
      ctx.moveTo(cx, cy + 80);
      ctx.quadraticCurveTo(cx + 100, cy + 110, cx + 180, cy + 80);
      ctx.lineTo(cx + 180, cy - 80);
      ctx.quadraticCurveTo(cx + 100, cy - 50, cx, cy - 80);
      ctx.closePath();
      ctx.stroke();

      // Bookmark ribbon
      ctx.beginPath();
      ctx.moveTo(cx, cy - 80);
      ctx.lineTo(cx, cy + 120);
      ctx.lineTo(cx - 10, cy + 110);
      ctx.lineTo(cx, cy + 120);
      ctx.stroke();
    } else if (type === "camel") {
      // Camel outline
      const cx = width * 0.5;
      const cy = height * 0.5;

      ctx.beginPath();
      ctx.moveTo(cx - 120, cy + 60); // Tail area
      ctx.lineTo(cx - 110, cy + 40);
      // Hump
      ctx.quadraticCurveTo(cx - 60, cy - 40, cx - 20, cy + 20);
      ctx.quadraticCurveTo(cx + 10, cy - 20, cx + 50, cy + 20);
      // Neck
      ctx.lineTo(cx + 80, cy - 30);
      ctx.quadraticCurveTo(cx + 90, cy - 60, cx + 110, cy - 60); // Head
      ctx.lineTo(cx + 100, cy - 30);
      ctx.lineTo(cx + 60, cy + 50); // Chest
      // Legs front
      ctx.lineTo(cx + 50, cy + 130);
      ctx.lineTo(cx + 40, cy + 130);
      ctx.lineTo(cx + 45, cy + 60);
      // Belly
      ctx.quadraticCurveTo(cx, cy + 70, cx - 40, cy + 60);
      // Legs back
      ctx.lineTo(cx - 50, cy + 130);
      ctx.lineTo(cx - 60, cy + 130);
      ctx.lineTo(cx - 70, cy + 60);
      ctx.closePath();
      ctx.stroke();
    }
  };

  // Redraw canvas on modal open or template change
  useEffect(() => {
    if (activeModal === "coloring" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear all previous lines
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawOutline(ctx, selectedSketch, canvas.width, canvas.height);
      }
    }
  }, [activeModal, selectedSketch, darkMode]);

  // Handle Drawing events on canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (e.cancelable) e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (e.cancelable) e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Export paint canvas masterpiece
  const downloadPainting = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `my_islamic_masterpiece_${selectedSketch}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Print Paint Canvas
  const printPainting = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>My Islamic Coloring Masterpiece</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: 'Nunito', sans-serif; }
              img { max-width: 90%; max-height: 80%; border: 4px solid #10b981; border-radius: 20px; }
              h1 { color: #047857; margin-bottom: 20px; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <h1>My Ummah Kids Masterpiece</h1>
            <img src="${dataUrl}" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Clear Canvas back to original outline
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      drawOutline(ctx, selectedSketch, canvas.width, canvas.height);
    }
  };

  // Launching interactive workspace printing
  const printActiveWorksheet = (type: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let content = "";
    if (type === "arabic") {
      content = `
        <div class="worksheet-container">
          <div class="header">
            <h2>✨ ARABIC ALPHABET TRACING WORKSHEET ✨</h2>
            <p>Ummah Kids Learning Companion</p>
          </div>
          <p class="instr">Instruction: Grab your pencil or favorite crayon and trace the holy Arabic letters below from right to left!</p>
          <div class="arabic-grid">
            <div class="letter-box"><span class="arabic">أ</span><span class="trace">أ أ أ أ</span><span class="label">Alif</span></div>
            <div class="letter-box"><span class="arabic">ب</span><span class="trace">ب ب ب ب</span><span class="label">Ba</span></div>
            <div class="letter-box"><span class="arabic">ت</span><span class="trace">ت ت ت ت</span><span class="label">Ta</span></div>
            <div class="letter-box"><span class="arabic">ث</span><span class="trace">ث ث ث ث</span><span class="label">Tha</span></div>
            <div class="letter-box"><span class="arabic">ج</span><span class="trace">ج ج ج ج</span><span class="label">Jeem</span></div>
            <div class="letter-box"><span class="arabic">ح</span><span class="trace">ح ح ح ح</span><span class="label">Haa</span></div>
          </div>
          <div class="footer">Beautifully printed on ${new Date().toLocaleDateString()} • Keep up the amazing work! ⭐</div>
        </div>
      `;
    } else if (type === "salah") {
      content = `
        <div class="worksheet-container">
          <div class="header">
            <h2>🕌 MY DAILY SALAH TRACKER CHART 🕌</h2>
            <p>Track your five beautiful daily prayers and color the stars!</p>
          </div>
          <p class="instr">Instruction: For every Salah you complete today, color in the beautiful star next to it!</p>
          <table class="tracker-table">
            <thead>
              <tr>
                <th>Prayer Name</th>
                <th>Time of Day</th>
                <th>Star Tracker (Color it!)</th>
                <th>Points Earned</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>🌅 Fajr (Dawn)</td><td>Before Sunrise</td><td>⭐⭐⭐⭐⭐</td><td>+10 Points</td></tr>
              <tr><td>☀️ Dhuhr (Noon)</td><td>Afternoon</td><td>⭐⭐⭐⭐⭐</td><td>+10 Points</td></tr>
              <tr><td>⛅ Asr (Late Afternoon)</td><td>Late Afternoon</td><td>⭐⭐⭐⭐⭐</td><td>+10 Points</td></tr>
              <tr><td>🌇 Maghrib (Sunset)</td><td>Just after Sunset</td><td>⭐⭐⭐⭐⭐</td><td>+10 Points</td></tr>
              <tr><td>🌙 Isha (Night)</td><td>Night Time</td><td>⭐⭐⭐⭐⭐</td><td>+10 Points</td></tr>
            </tbody>
          </table>
          <div class="footer">Proudly tracking with Ummah Kids • Designed for Parents & Kids</div>
        </div>
      `;
    } else if (type === "duas") {
      content = `
        <div class="worksheet-container">
          <div class="header">
            <h2>🌱 MY DAILY MASNOON DUAS CHECKLIST 🌱</h2>
            <p>Learn beautiful daily supplications with their moral values!</p>
          </div>
          <p class="instr">Instruction: Practice these 4 daily Duas and tick them off once you say them with clear translation!</p>
          <div class="dua-card">
            <h3>1. Dua upon Waking Up ☀️</h3>
            <p class="arabic">الْحَمْدُ للهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ</p>
            <p class="meaning">"All praise is to Allah who gave us life after having taken it, and to Him is our return."</p>
            <div class="check-box">Completed: [  ]</div>
          </div>
          <div class="dua-card">
            <h3>2. Dua Before Eating 🍎</h3>
            <p class="arabic">بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ</p>
            <p class="meaning">"In the name of Allah and upon the blessings of Allah."</p>
            <div class="check-box">Completed: [  ]</div>
          </div>
          <div class="dua-card">
            <h3>3. Dua Before Sleeping 🛌</h3>
            <p class="arabic">بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا</p>
            <p class="meaning">"In Your name, O Allah, I die and I live."</p>
            <div class="check-box">Completed: [  ]</div>
          </div>
          <div class="footer">Daily Supplications Checklist • Crafted for curious children</div>
        </div>
      `;
    } else {
      content = `
        <div class="worksheet-container">
          <div class="header">
            <h2>📖 MY STORY REFLECTION ACTIVITY SHEET 📖</h2>
            <p>Reflect on the beautiful moral lessons from today's stories</p>
          </div>
          <p class="instr">Instruction: Fill out the answers below after reading your favorite story on our platform!</p>
          <div class="question-line"><strong>Today's Story Title:</strong> __________________________________________________</div>
          <div class="question-line"><strong>My Favorite Character is:</strong> _________________________________________________</div>
          <div class="question-line"><strong>The main Moral Lesson from this story was:</strong></div>
          <div class="blank-box"></div>
          <div class="question-line"><strong>My Favorite Scene (Draw it below!):</strong></div>
          <div class="blank-box" style="height: 250px;"></div>
          <div class="footer">Reflective Learning Companion • Keep sharing beautiful moral values!</div>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Ummah Kids - Printable Worksheet</title>
          <style>
            body { font-family: 'Nunito', sans-serif; background-color: #ffffff; color: #1e293b; padding: 40px; margin: 0; }
            .worksheet-container { border: 4px dashed #10b981; border-radius: 24px; padding: 30px; max-width: 800px; margin: 0 auto; background: #ffffff; }
            .header { text-align: center; border-b: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
            .header h2 { color: #047857; font-size: 24px; margin: 0 0 5px 0; }
            .header p { color: #d97706; margin: 0; font-size: 14px; font-weight: bold; }
            .instr { font-style: italic; color: #475569; background: #f0fdf4; border-left: 5px solid #10b981; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 25px; }
            .arabic { font-family: 'Noto Naskh Arabic', serif; font-size: 26px; text-align: right; display: block; margin: 15px 0; color: #047857; direction: rtl; }
            .arabic-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .letter-box { border: 2px solid #e2e8f0; border-radius: 16px; padding: 15px; text-align: center; background: #fafafa; }
            .trace { font-size: 22px; color: #cbd5e1; letter-spacing: 12px; display: block; margin: 8px 0; border-bottom: 1px dotted #cbd5e1; padding-bottom: 8px; }
            .label { font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; }
            .tracker-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .tracker-table th, .tracker-table td { border: 1px solid #cbd5e1; padding: 12px; text-align: center; }
            .tracker-table th { background: #10b981; color: white; }
            .dua-card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 15px; margin-bottom: 15px; background: #fcfcfc; }
            .dua-card h3 { margin: 0; color: #d97706; font-size: 16px; }
            .meaning { font-style: italic; font-size: 13px; color: #475569; margin: 5px 0 0 0; }
            .check-box { font-weight: bold; text-align: right; color: #047857; font-size: 12px; margin-top: 10px; }
            .question-line { font-size: 15px; margin: 20px 0; line-height: 1.8; color: #334155; }
            .blank-box { border: 2px solid #e2e8f0; border-radius: 12px; height: 120px; background: #fafafa; margin: 10px 0; }
            .footer { text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px; font-size: 11px; color: #94a3b8; font-weight: bold; }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet" />
        </head>
        <body onload="window.print(); window.close();">
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all duration-200 print:hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Logo & Branding Area */}
          <div 
            onClick={() => {
              onNavigate("home");
              setMobileMenuOpen(false);
            }} 
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink min-w-0"
            id="logo-container"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-500 transition-colors shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col justify-center select-none text-left min-w-0">
              <h1 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight font-sans truncate">
                Ummah Kids
              </h1>
              <div className="flex items-center gap-1 leading-none">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 font-sans truncate">
                  by Inaamullah
                </span>
                <span className="hidden sm:inline text-[9px] text-slate-300 dark:text-slate-600 leading-none">•</span>
                <span className="hidden sm:inline text-[10px] font-urdu font-medium text-emerald-600 dark:text-emerald-400 leading-none">
                  امت کڈز
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-1">
            {primaryNavItems.map((item) => {
              const isActive = currentView === item.id || (item.id === "stories" && currentView.startsWith("category:"));
              const navLabel = getTranslation(item.key, language);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                    isRTL ? (language === "ur" ? "font-urdu" : "font-arabic") : "font-sans"
                  } ${
                    isActive
                      ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                  id={`nav-${item.id}`}
                >
                  <span>{navLabel}</span>
                </button>
              );
            })}

            {/* Learn ▼ Dropdown Menu */}
            <div className="relative" ref={learnRef}>
              <button
                onClick={() => setShowLearnMenu(!showLearnMenu)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  isRTL ? (language === "ur" ? "font-urdu" : "font-arabic") : "font-sans"
                } ${
                  ["quran", "salah", "duas", "hadiths", "games", "scholar"].includes(currentView)
                    ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
                id="nav-learn"
              >
                <span>{getTranslation("learnMenu", language)}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showLearnMenu ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showLearnMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-3xl p-3 shadow-2xl z-50 flex flex-col gap-1"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1.5 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider font-sans">
                        {getTranslation("educationalHub", language)}
                      </span>
                    </div>
                    {learnItems.map((hub) => {
                      const hubLabel = getTranslation(hub.key, language);
                      return (
                        <button
                          key={hub.id}
                          onClick={() => {
                            setShowLearnMenu(false);
                            if (hub.id === "quiz-challenge") {
                              onNavigate("games");
                            } else if (hub.id === "coloring") {
                              setActiveModal("coloring");
                            } else if (hub.id === "worksheets") {
                              setActiveModal("worksheets");
                            } else {
                              onNavigate(hub.id);
                            }
                          }}
                          className={`px-3.5 py-2.5 rounded-2xl text-xs font-black text-left flex items-center justify-between cursor-pointer transition-colors ${
                            currentView === hub.id
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base filter drop-shadow-xs shrink-0">{hub.emoji}</span>
                            <span className={`leading-none ${isRTL ? (language === "ur" ? "font-urdu text-sm" : "font-arabic text-sm") : "font-sans"}`}>
                              {hubLabel}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Search Toggle Button */}
            <div className="relative">
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 180, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-10 top-1/2 -translate-y-1/2 overflow-hidden h-10 flex items-center z-20"
                  >
                    <input
                      type="text"
                      placeholder="Search stories... تلاش"
                      value={searchQuery}
                      onChange={(e) => onSearch(e.target.value)}
                      className="w-full px-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-hidden focus:ring-2 focus:ring-emerald-400 text-slate-800 dark:text-slate-100 font-sans shadow-md"
                      id="desktop-search-input"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  if (!searchOpen) onNavigate("stories");
                }}
                className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Search Stories"
                id="search-toggle-btn"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Language Switcher Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                title="Select Language"
                id="language-toggle-btn"
              >
                <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-black uppercase font-sans">{language}</span>
              </button>

              {/* Bookmarks Shortcut Button (Visible sm+) */}
              <button
                onClick={() => onNavigate("bookmarks")}
                className="hidden sm:block p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-all cursor-pointer relative"
                title="Bookmarks"
                id="header-bookmark-btn"
              >
                <Heart className="w-5 h-5 text-rose-500" />
                {bookmarkCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                    {bookmarkCount > 9 ? "9+" : bookmarkCount}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-3xl p-2.5 shadow-2xl z-50 flex flex-col gap-1"
                  >
                    <button
                      onClick={() => { onLanguageChange("en"); setShowLangMenu(false); }}
                      className={`px-3 py-2 rounded-2xl text-xs font-black text-left cursor-pointer transition-colors font-sans ${language === "en" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => { onLanguageChange("ur"); setShowLangMenu(false); }}
                      className={`px-3 py-2 rounded-2xl text-xs font-urdu text-right cursor-pointer transition-colors ${language === "ur" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
                    >
                      اردو (Urdu)
                    </button>
                    <button
                      onClick={() => { onLanguageChange("ar"); setShowLangMenu(false); }}
                      className={`px-3 py-2 rounded-2xl text-xs font-semibold text-right cursor-pointer transition-colors font-arabic ${language === "ar" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
                    >
                      العربية (Arabic)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Interactive Notifications System (Hidden on small mobile, visible sm+) */}
            <div className="relative hidden sm:block" ref={notifyRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-all cursor-pointer relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-3xl p-3 shadow-2xl z-50 flex flex-col gap-2 text-left"
                  >
                    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800 dark:text-emerald-400 font-sans">Moral Reminders & Activity</span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-sans">Updates</span>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto pr-1">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl flex gap-3 transition-colors">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.color}`}>
                            <n.icon className="w-5 h-5 shrink-0" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none font-sans">{n.title}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans">{n.text}</p>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-1.5 block font-sans">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu Dropdown (Hidden on mobile header, available in drawer and sm+) */}
            <div className="relative hidden sm:block" ref={profileRef}>
              {parentUser ? (
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1.5 p-1 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 rounded-full border border-emerald-100/50 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-400 cursor-pointer transition-all"
                  title="Profile and Dashboard Menu"
                >
                  <span className="text-2xl filter drop-shadow-xs shrink-0 ml-1">
                    {activeKidProfile?.avatar || "🐣"}
                  </span>
                  <div className="flex flex-col text-left pr-2 max-w-[80px] hidden sm:flex leading-none">
                    <span className="text-[10px] font-black truncate font-sans text-slate-800 dark:text-slate-200">
                      {activeKidProfile?.name || "No Profile"}
                    </span>
                    <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5 mt-0.5 font-sans leading-none">
                      <Award className="w-2.5 h-2.5 fill-amber-500/20 shrink-0" />
                      {activeKidProfile?.points || 0} pts
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 mr-1 shrink-0" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                  }}
                  className="p-2.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Guest Profile"
                >
                  <Users className="w-5 h-5" />
                </button>
              )}

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-3xl p-2.5 shadow-2xl z-50 flex flex-col gap-1 text-left"
                  >
                    {parentUser ? (
                      <>
                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1.5 flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Active Kid</span>
                          <span className="text-xs font-black text-slate-800 dark:text-emerald-400 font-sans mt-0.5">{activeKidProfile?.name || "Select Profile"}</span>
                        </div>

                        {/* Profile Links */}
                        <button
                          onClick={() => {
                            onOpenKidProfiles();
                            setShowProfileMenu(false);
                          }}
                          className="px-3 py-2 rounded-2xl text-xs font-black text-left flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-sans"
                        >
                          <Users className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>My Profile</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveModal("rewards");
                            setShowProfileMenu(false);
                          }}
                          className="px-3 py-2 rounded-2xl text-xs font-black text-left flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-sans"
                        >
                          <Award className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Rewards</span>
                        </button>

                        <button
                          onClick={() => {
                            onNavigate("bookmarks");
                            setShowProfileMenu(false);
                          }}
                          className="px-3 py-2 rounded-2xl text-xs font-black text-left flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-sans"
                        >
                          <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>Bookmarks</span>
                        </button>

                        <button
                          onClick={() => {
                            onOpenDashboard();
                            setShowProfileMenu(false);
                          }}
                          className="px-3 py-2 rounded-2xl text-xs font-black text-left flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-sans"
                        >
                          <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                          <span>Reading Progress</span>
                        </button>

                        <button
                          onClick={() => {
                            onOpenDashboard();
                            setShowProfileMenu(false);
                          }}
                          className="px-3 py-2 rounded-2xl text-xs font-black text-left flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-sans"
                        >
                          <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>Parent Dashboard</span>
                        </button>

                        <button
                          onClick={() => {
                            onOpenDashboard();
                            setShowProfileMenu(false);
                          }}
                          className="px-3 py-2 rounded-2xl text-xs font-black text-left flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-sans"
                        >
                          <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>Settings</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onStartTour) onStartTour();
                            setShowProfileMenu(false);
                          }}
                          className="px-3 py-2 rounded-2xl text-xs font-black text-left flex items-center gap-2 cursor-pointer text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-sans border border-emerald-100 dark:border-emerald-900/40"
                        >
                          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Show App Tour Again</span>
                        </button>

                        {/* Admin Dashboard / Admin Portal */}
                        <button
                          onClick={() => {
                            onNavigate("admin");
                            setShowProfileMenu(false);
                          }}
                          className={`px-3 py-2 rounded-2xl text-xs font-black text-left flex items-center gap-2 cursor-pointer font-sans border transition-all mt-1 ${
                            isAdmin 
                              ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800"
                              : "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700"
                          }`}
                          id="header-admin-menu-btn"
                        >
                          <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{isAdmin ? "Admin Dashboard" : "Admin Portal"}</span>
                        </button>

                        <div className="border-t border-slate-100 dark:border-slate-800 my-1.5" />

                        <button
                          onClick={() => {
                            onLogout();
                            setShowProfileMenu(false);
                          }}
                          className="px-3 py-2 rounded-2xl text-xs font-black text-left flex items-center gap-2 cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-sans"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>Logout</span>
                        </button>
                      </>
                    ) : (
                      <div className="p-1 flex flex-col gap-1.5">
                        <div className="px-2 py-1 flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Visitor Mode</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5 font-sans">Sign in as parent or admin</span>
                        </div>
                        <button
                          onClick={() => {
                            if (onStartTour) onStartTour();
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-black shadow-xs cursor-pointer transition-all font-sans border border-emerald-200 dark:border-emerald-800"
                        >
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                          <span>Show App Tour Again</span>
                        </button>
                        <button
                          onClick={() => {
                            onOpenAuth();
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-xs cursor-pointer transition-all font-sans"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Parents Sign In</span>
                        </button>
                        <button
                          onClick={() => {
                            onNavigate("admin");
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl text-xs font-black shadow-xs cursor-pointer transition-all font-sans border border-slate-200 dark:border-slate-700"
                          id="header-admin-visitor-btn"
                        >
                          <ShieldAlert className="w-4 h-4 text-emerald-500" />
                          <span>{isAdmin ? "Admin Dashboard" : "Admin Portal"}</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dark Mode Theme Toggle (Desktop) */}
            <button
              onClick={toggleDarkMode}
              className="hidden sm:block p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Theme Toggle"
              id="theme-toggle-btn"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            </button>

            {/* Mobile Hamburger Drawer Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              id="mobile-menu-toggle-btn"
              aria-label="Toggle Mobile Navigation Drawer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-800 dark:text-slate-100" /> : <Menu className="w-6 h-6 text-slate-800 dark:text-slate-100" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Slide-out Overlay Drawer) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            {/* Dark Blur Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-[85%] max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 overflow-hidden text-left"
            >
              {/* Drawer Top Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h2 className="text-sm font-black text-slate-800 dark:text-emerald-400 font-sans truncate">
                      Ummah Kids
                    </h2>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-sans truncate">
                      by Inaamullah
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                  id="mobile-drawer-close-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search stories, surahs, duas..."
                    value={searchQuery}
                    onChange={(e) => {
                      onSearch(e.target.value);
                      onNavigate("stories");
                    }}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-400 text-slate-800 dark:text-slate-100 font-sans"
                    id="mobile-search-input"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                {/* Primary Navigation List */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3 font-sans">
                    Main Navigation
                  </span>

                  {[
                    { id: "home", label: "🏠 " + getTranslation("home", language) },
                    { id: "stories", label: "📚 " + getTranslation("allStories", language) },
                    { id: "quran", label: "📖 " + getTranslation("quranReader", language) },
                    { id: "videos", label: "🎥 " + getTranslation("islamicVideos", language) },
                    { id: "ai-teacher", label: "🤖 " + getTranslation("aiTeacher", language) },
                  ].map((item) => {
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-between min-h-[48px] ${
                          isActive
                            ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 font-bold border border-emerald-200/50 dark:border-emerald-800/50"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                        id={`mobile-drawer-${item.id}`}
                      >
                        <span className="font-sans">{item.label}</span>
                        {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </button>
                    );
                  })}
                </div>

                {/* Learn / Educational Hub Section */}
                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 px-3 font-sans">
                    🎓 {getTranslation("educationalHub", language)}
                  </span>

                  {learnItems.map((hub) => {
                    const isActive = currentView === hub.id;
                    const hubLabel = getTranslation(hub.key, language);
                    return (
                      <button
                        key={hub.id}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          if (hub.id === "quiz-challenge") {
                            onNavigate("games");
                          } else if (hub.id === "coloring") {
                            setActiveModal("coloring");
                          } else if (hub.id === "worksheets") {
                            setActiveModal("worksheets");
                          } else {
                            onNavigate(hub.id);
                          }
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2.5 min-h-[44px] ${
                          isActive
                            ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <span className="text-sm shrink-0">{hub.emoji}</span>
                        <span className="font-sans leading-none">{hubLabel}</span>
                      </button>
                    );
                  })}
                </div>

                {/* User Services & Extras */}
                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3 font-sans">
                    Personal & Admin
                  </span>

                  {/* Bookmarks */}
                  <button
                    onClick={() => {
                      onNavigate("bookmarks");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center justify-between min-h-[48px] ${
                      currentView === "bookmarks"
                        ? "text-rose-600 bg-rose-50 dark:bg-rose-950/30"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500 fill-current" />
                      <span className="font-sans">❤️ {getTranslation("bookmarks", language)}</span>
                    </div>
                    {bookmarkCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                        {bookmarkCount}
                      </span>
                    )}
                  </button>

                  {/* Parent Dashboard / Kids Profiles */}
                  <button
                    onClick={() => {
                      if (parentUser) {
                        onOpenDashboard();
                      } else {
                        onOpenKidProfiles();
                      }
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-3 rounded-2xl text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-between min-h-[48px]"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-500" />
                      <span className="font-sans">👨‍👩‍👧 {parentUser ? "Parent Dashboard" : "Kid Profiles"}</span>
                    </div>
                  </button>

                  {/* Admin Portal */}
                  <button
                    onClick={() => {
                      onNavigate("admin");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center justify-between min-h-[48px] ${
                      currentView === "admin"
                        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-emerald-500" />
                      <span className="font-sans">⚙️ {isAdmin ? "Admin Dashboard" : "Admin Portal"}</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Drawer Footer: Language & Theme Controls */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3 shrink-0">
                {/* Language Switcher Pills */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 font-sans">
                    🌐 Language / زبان
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl">
                    <button
                      onClick={() => onLanguageChange("en")}
                      className={`py-1.5 rounded-lg text-xs font-black transition-all ${
                        language === "en"
                          ? "bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => onLanguageChange("ur")}
                      className={`py-1.5 rounded-lg text-xs font-urdu font-bold transition-all ${
                        language === "ur"
                          ? "bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      اردو
                    </button>
                    <button
                      onClick={() => onLanguageChange("ar")}
                      className={`py-1.5 rounded-lg text-xs font-arabic font-bold transition-all ${
                        language === "ar"
                          ? "bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      العربية
                    </button>
                  </div>
                </div>

                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 cursor-pointer min-h-[44px]"
                >
                  <div className="flex items-center gap-2">
                    {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                    <span className="font-sans">{darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
                  </div>
                  <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400">
                    {darkMode ? "ON" : "OFF"}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* 🎨 INTERACTIVE KIDS COLORING CANVAS MODAL (100% REAL & OFFLINE) */}
      {/* ========================================================== */}
      <AnimatePresence>
        {activeModal === "coloring" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-white dark:bg-slate-850 rounded-3xl p-6 shadow-2xl border border-slate-150 dark:border-slate-800 flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto"
            >
              
              {/* Canvas Painting Board */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl filter drop-shadow-xs">🎨</span>
                    <div>
                      <h3 className="text-base font-black text-slate-800 dark:text-slate-100 font-sans leading-none">Kid's Islamic Coloring Studio</h3>
                      <p className="text-[10px] font-black text-amber-500 font-sans leading-none mt-1">RANG BHAREEN • رنگ بھریں</p>
                    </div>
                  </div>
                  
                  {/* Select Outline templates */}
                  <div className="flex items-center gap-1.5">
                    {(["mosque", "moon", "quran", "camel"] as const).map((sketch) => (
                      <button
                        key={sketch}
                        onClick={() => setSelectedSketch(sketch)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize cursor-pointer transition-all ${selectedSketch === sketch ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"}`}
                      >
                        {sketch}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drawing Stage Container */}
                <div className="relative w-full aspect-video md:aspect-[4/3] bg-white rounded-2xl border-4 border-dashed border-emerald-500/30 overflow-hidden shadow-inner flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={450}
                    className="w-full h-full max-w-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>

                {/* Draw brush sizes slider and tools */}
                <div className="w-full grid grid-cols-2 sm:flex items-center justify-between gap-4 mt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 font-sans uppercase tracking-wider">Brush Size</span>
                    <div className="flex gap-1.5">
                      {[4, 8, 12, 18].map((size) => (
                        <button
                          key={size}
                          onClick={() => setBrushSize(size)}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all ${brushSize === size ? "bg-emerald-600 text-white border-emerald-500" : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                        >
                          <div className="rounded-full bg-current" style={{ width: size, height: size }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearCanvas}
                      className="px-3.5 py-2 text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear
                    </button>
                    <button
                      onClick={downloadPainting}
                      className="px-3.5 py-2 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Save PNG
                    </button>
                    <button
                      onClick={printPainting}
                      className="px-3.5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print
                    </button>
                  </div>
                </div>
              </div>

              {/* Color Selection Palette Drawer */}
              <div className="w-full md:w-52 shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-slate-150 dark:border-slate-800 pt-5 md:pt-0 md:pl-5 text-left">
                <div className="flex items-center gap-1.5 mb-4 font-sans text-slate-800 dark:text-emerald-400">
                  <Palette className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-wider">Color Palette</span>
                </div>
                
                <div className="grid grid-cols-4 md:grid-cols-2 gap-2 flex-1 overflow-y-auto">
                  {paletteColors.map((color) => {
                    const isSelected = brushColor === color.hex;
                    return (
                      <button
                        key={color.hex}
                        onClick={() => setBrushColor(color.hex)}
                        className={`p-1.5 rounded-2xl flex items-center gap-2 cursor-pointer transition-all border ${isSelected ? "border-emerald-600 dark:border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/10 scale-102" : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}
                        title={color.name}
                      >
                        <div
                          className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs relative flex items-center justify-center"
                          style={{ backgroundColor: color.hex }}
                        >
                          {isSelected && (
                            <div className={`w-2.5 h-2.5 rounded-full ${color.hex === "#ffffff" ? "bg-slate-800" : "bg-white"}`} />
                          )}
                        </div>
                        <span className="text-[10px] font-black truncate text-slate-700 dark:text-slate-300 leading-none">
                          {color.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2">
                  <button
                    onClick={() => setActiveModal("none")}
                    className="w-full py-2.5 rounded-xl text-center text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer"
                  >
                    Close Studio
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* 🖨️ KIDS PRINTABLE WORKSHEETS DASHBOARD MODAL */}
      {/* ========================================================== */}
      <AnimatePresence>
        {activeModal === "worksheets" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-850 rounded-3xl p-6 shadow-2xl border border-slate-150 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-4 mb-5 text-left">
                <div className="flex items-center gap-2.5 font-sans">
                  <span className="text-2xl filter drop-shadow-xs">🖨️</span>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 leading-none">Kids Printable Worksheets</h3>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-wide leading-none mt-1">Free child-friendly learning activities</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal("none")}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Worksheets Grid Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 text-left">
                
                {/* Worksheet 1: Arabic Alphabet Tracing */}
                <div
                  onClick={() => setSelectedWorksheet("arabic")}
                  className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between ${selectedWorksheet === "arabic" ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20" : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">✍️</span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full uppercase tracking-wider">Arabic Letters</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-3 font-sans">Arabic Alphabet Tracing Sheet</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans">Perfect for absolute beginners to trace holy letters Alif, Ba, Ta easily with pencils.</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); printActiveWorksheet("arabic"); }}
                    className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Tracing Sheet
                  </button>
                </div>

                {/* Worksheet 2: Daily Salah Tracker */}
                <div
                  onClick={() => setSelectedWorksheet("salah")}
                  className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between ${selectedWorksheet === "salah" ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20" : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">🕌</span>
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full uppercase tracking-wider"> Salah Chart </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-3 font-sans">My Daily Salah Tracker Chart</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans">Cute weekly chart for kids to check off and color in their five daily prayers.</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); printActiveWorksheet("salah"); }}
                    className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Daily Salah Chart
                  </button>
                </div>

                {/* Worksheet 3: Daily Duas checklist */}
                <div
                  onClick={() => setSelectedWorksheet("duas")}
                  className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between ${selectedWorksheet === "duas" ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20" : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">🌱</span>
                      <span className="text-[9px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950 px-2 py-0.5 rounded-full uppercase tracking-wider">Daily Duas</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-3 font-sans">Daily Masnoon Duas Checklist</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans">A supplications checklist with wake up, meals, and bedtime duas with translations.</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); printActiveWorksheet("duas"); }}
                    className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Duas Checklist
                  </button>
                </div>

                {/* Worksheet 4: Story Reflection Sheet */}
                <div
                  onClick={() => setSelectedWorksheet("story")}
                  className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between ${selectedWorksheet === "story" ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20" : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">📖</span>
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full uppercase tracking-wider">Reflection</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-3 font-sans">Story Review Reflection Sheet</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans">Write down the story title, draw your favorite scenes, and outline moral lessons.</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); printActiveWorksheet("story"); }}
                    className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Reflection Sheet
                  </button>
                </div>

              </div>

              <div className="mt-6 border-t border-slate-150 dark:border-slate-800 pt-4 flex justify-end">
                <button
                  onClick={() => setActiveModal("none")}
                  className="px-5 py-2 text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl cursor-pointer"
                >
                  Close Worksheets
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* 🏆 REWARDS & MILESTONES DASHBOARD MODAL */}
      {/* ========================================================== */}
      <AnimatePresence>
        {activeModal === "rewards" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white dark:bg-slate-850 rounded-3xl p-6 shadow-2xl border border-slate-150 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-4 mb-5 text-left">
                <div className="flex items-center gap-2.5 font-sans">
                  <span className="text-2xl filter drop-shadow-xs">🏆</span>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 leading-none">Kid's Rewards & Milestones</h3>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-wide leading-none mt-1">Unlock beautiful Islamic moral achievements!</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal("none")}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active Profile Rewards Stats */}
              {activeKidProfile ? (
                <div className="space-y-6 text-left">
                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-amber-500/10 dark:from-emerald-950/20 dark:to-amber-950/20 rounded-3xl border border-emerald-500/20 dark:border-emerald-500/10 flex items-center gap-4">
                    <span className="text-4xl filter drop-shadow-sm">{activeKidProfile.avatar || "🐣"}</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans leading-none">{activeKidProfile.name}</h4>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-sans leading-none">
                          <Award className="w-3.5 h-3.5 fill-amber-500/10 shrink-0" />
                          {activeKidProfile.points} points
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-sans leading-none">
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          Level {Math.floor(activeKidProfile.points / 100) + 1}
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-amber-500"
                          style={{ width: `${activeKidProfile.points % 100}%` }}
                        />
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1.5 leading-none">
                        {100 - (activeKidProfile.points % 100)} more points to next level!
                      </p>
                    </div>
                  </div>

                  {/* List of custom award Badges */}
                  <div className="space-y-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest font-sans">Moral Milestones & Badges</span>
                    
                    {/* Badge 1: Quran Reader */}
                    <div className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${activeKidProfile.points >= 50 ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10" : "border-slate-100 dark:border-slate-800 opacity-60"}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-emerald-50 dark:bg-emerald-950/40`}>📖</div>
                      <div className="flex-1">
                        <h5 className="text-xs font-black text-slate-800 dark:text-slate-100 font-sans leading-none">Quran Reader Milestone</h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">Unlocked by completing custom Quran read stories! (Unlocked at 50 pts)</p>
                      </div>
                      <span className="text-xs font-black">{activeKidProfile.points >= 50 ? "✅ Unlocked" : "🔒 Locked"}</span>
                    </div>

                    {/* Badge 2: Salah Scholar */}
                    <div className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${activeKidProfile.points >= 150 ? "border-amber-500 bg-amber-50/10 dark:bg-amber-950/10" : "border-slate-100 dark:border-slate-800 opacity-60"}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-amber-50 dark:bg-amber-950/40`}>🕌</div>
                      <div className="flex-1">
                        <h5 className="text-xs font-black text-slate-800 dark:text-slate-100 font-sans leading-none">Salah Scholar Milestone</h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">Practice organizing steps and perform prayers to earn! (Unlocked at 150 pts)</p>
                      </div>
                      <span className="text-xs font-black">{activeKidProfile.points >= 150 ? "✅ Unlocked" : "🔒 Locked"}</span>
                    </div>

                    {/* Badge 3: Moral Champion */}
                    <div className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${activeKidProfile.points >= 300 ? "border-purple-500 bg-purple-50/10 dark:bg-purple-950/10" : "border-slate-100 dark:border-slate-800 opacity-60"}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-purple-50 dark:bg-purple-950/40`}>🌟</div>
                      <div className="flex-1">
                        <h5 className="text-xs font-black text-slate-800 dark:text-slate-100 font-sans leading-none">Moral Champion Badge</h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">Earned by showing extraordinary moral comprehension in story quizzes. (Unlocked at 300 pts)</p>
                      </div>
                      <span className="text-xs font-black">{activeKidProfile.points >= 300 ? "✅ Unlocked" : "🔒 Locked"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 font-sans">
                  <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold">Please select or create a kid's profile to track milestones!</p>
                </div>
              )}

              <div className="mt-6 border-t border-slate-150 dark:border-slate-800 pt-4 flex justify-end">
                <button
                  onClick={() => setActiveModal("none")}
                  className="px-5 py-2 text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl cursor-pointer"
                >
                  Close Rewards
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* 📱 ERGONOMIC MOBILE BOTTOM NAVIGATION BAR (Kids & Mobile) */}
      {/* ========================================================== */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-1 py-1.5 flex items-center justify-around shadow-lg print:hidden"
        aria-label="Mobile Bottom Navigation"
        id="mobile-bottom-navigation-bar"
      >
        {/* 1. Home Tab */}
        <button
          onClick={() => {
            onNavigate("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
            currentView === "home"
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
          }`}
          id="mobile-nav-home-btn"
        >
          <Home className={`w-5 h-5 transition-transform ${currentView === "home" ? "scale-110" : ""}`} />
          <span className="text-[10px] mt-0.5 font-sans leading-none truncate max-w-[60px]">
            {getTranslation("home", language)}
          </span>
        </button>

        {/* 2. Stories Tab */}
        <button
          onClick={() => {
            onNavigate("stories");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
            currentView === "stories"
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
          }`}
          id="mobile-nav-stories-btn"
        >
          <BookOpen className={`w-5 h-5 transition-transform ${currentView === "stories" ? "scale-110" : ""}`} />
          <span className="text-[10px] mt-0.5 font-sans leading-none truncate max-w-[60px]">
            {language === "ur" ? "کہانیاں" : language === "ar" ? "قصص" : "Stories"}
          </span>
        </button>

        {/* 3. Quran Tab */}
        <button
          onClick={() => {
            onNavigate("quran");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
            currentView === "quran"
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
          }`}
          id="mobile-nav-quran-btn"
        >
          <span className={`text-base transition-transform leading-none ${currentView === "quran" ? "scale-110" : ""}`}>📖</span>
          <span className="text-[10px] mt-0.5 font-sans leading-none truncate max-w-[60px]">
            {language === "ur" ? "قرآن" : language === "ar" ? "القرآن" : "Quran"}
          </span>
        </button>

        {/* 4. AI Teacher Tab */}
        <button
          onClick={() => {
            onNavigate("ai-teacher");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
            currentView === "ai-teacher"
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
          }`}
          id="mobile-nav-teacher-btn"
        >
          <span className={`text-base transition-transform leading-none ${currentView === "ai-teacher" ? "scale-110" : ""}`}>🤖</span>
          <span className="text-[10px] mt-0.5 font-sans leading-none truncate max-w-[60px]">
            {getTranslation("aiTeacher", language)}
          </span>
        </button>

        {/* 5. Profile Tab */}
        <button
          onClick={() => {
            if (parentUser || activeKidProfile) {
              onOpenKidProfiles();
            } else {
              onOpenAuth();
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
            currentView === "kids-profiles" || currentView === "parent-dashboard"
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
          }`}
          id="mobile-nav-profile-btn"
        >
          {activeKidProfile?.avatar ? (
            <span className="text-base leading-none">{activeKidProfile.avatar}</span>
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="text-[10px] mt-0.5 font-sans leading-none truncate max-w-[60px]">
            {activeKidProfile?.name || (language === "ur" ? "پروفائل" : "Profile")}
          </span>
        </button>
      </nav>

    </header>
  );
}

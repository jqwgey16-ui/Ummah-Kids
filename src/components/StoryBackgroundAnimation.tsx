import React from "react";
import { motion } from "motion/react";

interface StoryBackgroundAnimationProps {
  category: string;
  prophetName?: string;
  title?: string;
}

export default function StoryBackgroundAnimation({
  category,
  prophetName,
}: StoryBackgroundAnimationProps) {
  const catLower = (category || "").toLowerCase();
  const prophetLower = (prophetName || "").toLowerCase();

  // Determine category theme
  let theme: "prophetic" | "quranic" | "moral" | "companions" | "nature" = "moral";

  if (
    prophetLower.length > 0 ||
    catLower.includes("prophet") ||
    catLower.includes("messenger") ||
    catLower.includes("anbiya") ||
    catLower.includes("prophetic")
  ) {
    theme = "prophetic";
  } else if (
    catLower.includes("quran") ||
    catLower.includes("surah") ||
    catLower.includes("revelation") ||
    catLower.includes("verse")
  ) {
    theme = "quranic";
  } else if (
    catLower.includes("companion") ||
    catLower.includes("sahaba") ||
    catLower.includes("hero") ||
    catLower.includes("history") ||
    catLower.includes("caliph")
  ) {
    theme = "companions";
  } else if (
    catLower.includes("nature") ||
    catLower.includes("creation") ||
    catLower.includes("animal") ||
    catLower.includes("miracle") ||
    catLower.includes("environment")
  ) {
    theme = "nature";
  } else {
    // Default to moral & character (warm, calm animation)
    theme = "moral";
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden z-0 print:hidden select-none"
    >
      {/* 1. PROPHETIC THEME: Grand, Sweeping Movement & Amber Dawn Light Beams */}
      {theme === "prophetic" && (
        <>
          {/* Sweeping grand light beam from top-left to bottom-right */}
          <motion.div
            initial={{ opacity: 0, x: "-30%", y: "-30%" }}
            animate={{
              x: ["-20%", "40%", "-20%"],
              y: ["-20%", "20%", "-20%"],
              opacity: [0.18, 0.35, 0.18],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-400/30 via-yellow-500/20 to-amber-600/0 blur-3xl dark:from-amber-500/20 dark:via-amber-600/10"
          />

          {/* Secondary sweeping diagonal beam */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              x: ["100%", "-20%"],
              opacity: [0, 0.25, 0],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-1/4 -right-20 w-[800px] h-32 -rotate-45 bg-gradient-to-r from-transparent via-amber-300/25 to-transparent blur-2xl dark:via-amber-400/15"
          />

          {/* Grand ambient central aura */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.12, 0.28, 0.12],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-amber-300/20 dark:bg-amber-500/10 blur-3xl"
          />

          {/* Slowly rotating grand Islamic geometric star watermark */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 right-[-80px] sm:right-10 opacity-[0.04] dark:opacity-[0.07] text-amber-900 dark:text-amber-200"
          >
            <svg width="420" height="420" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 0 L61.8 38.2 L100 50 L61.8 61.8 L50 100 L38.2 61.8 L0 50 L38.2 38.2 Z" />
              <path d="M14.6 14.6 L50 29.3 L85.4 14.6 L70.7 50 L85.4 85.4 L50 70.7 L14.6 85.4 L29.3 50 Z" />
            </svg>
          </motion.div>

          {/* Floating noble golden dust motes drifting diagonally */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`prophetic-mote-${i}`}
              initial={{
                x: `${(i * 12) % 90}%`,
                y: "110%",
                opacity: 0,
                scale: 0.6 + (i % 3) * 0.3,
              }}
              animate={{
                y: ["110%", "-10%"],
                x: [`${(i * 12) % 90}%`, `${((i * 12) % 90) + (i % 2 === 0 ? 15 : -15)}%`],
                opacity: [0, 0.6, 0.8, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 14 + (i % 4) * 3,
                repeat: Infinity,
                delay: i * 1.8,
                ease: "easeInOut",
              }}
              className="absolute w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
            />
          ))}
        </>
      )}

      {/* 2. MORAL THEME: Warm, Calm Animation with Peaceful Breathing Rhythm */}
      {theme === "moral" && (
        <>
          {/* Main warm breathing glow (Inhale / Exhale rhythm) */}
          <motion.div
            animate={{
              scale: [1, 1.18, 1],
              opacity: [0.2, 0.45, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-emerald-300/30 via-teal-200/25 to-amber-200/20 blur-3xl dark:from-emerald-600/15 dark:via-teal-600/15 dark:to-amber-500/10"
          />

          {/* Gentle expanding concentric calm rings */}
          <motion.div
            animate={{
              scale: [0.8, 1.4, 0.8],
              opacity: [0.1, 0.25, 0.1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full border-2 border-emerald-400/20 dark:border-emerald-400/10"
          />

          {/* Secondary calm bottom glow */}
          <motion.div
            animate={{
              scale: [1.1, 0.9, 1.1],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute bottom-1/4 right-[-100px] w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-amber-300/20 via-emerald-200/20 to-transparent blur-3xl dark:from-amber-500/10 dark:via-emerald-500/10"
          />

          {/* Soft floating bokehs floating gently up and down */}
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={`moral-bokeh-${i}`}
              animate={{
                y: [0, -35, 0],
                x: [0, i % 2 === 0 ? 20 : -20, 0],
                opacity: [0.25, 0.55, 0.25],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 7 + i * 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.2,
              }}
              style={{
                top: `${20 + (i * 12)}%`,
                left: `${10 + (i * 15) % 80}%`,
              }}
              className={`absolute rounded-full blur-xs ${
                i % 2 === 0
                  ? "w-8 h-8 bg-emerald-400/30 dark:bg-emerald-300/20"
                  : "w-10 h-10 bg-amber-300/35 dark:bg-amber-400/20"
              }`}
            />
          ))}
        </>
      )}

      {/* 3. QURANIC THEME: Mystical Celestial & Starlight Animation */}
      {theme === "quranic" && (
        <>
          {/* Celestial aura backdrop glow */}
          <motion.div
            animate={{
              opacity: [0.2, 0.45, 0.2],
              scale: [1, 1.12, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-indigo-400/25 via-emerald-400/20 to-teal-300/10 blur-3xl dark:from-indigo-600/20 dark:via-emerald-600/15"
          />

          {/* Floating glowing crescent outline */}
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [0, 8, 0],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-12 right-12 text-indigo-800 dark:text-indigo-200"
          >
            <svg width="220" height="220" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M50,10 A40,40 0 1,0 90,50 A32,32 0 1,1 50,10 Z" fill="currentColor" fillOpacity="0.08" />
            </svg>
          </motion.div>

          {/* Twinkling starlight particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={`quranic-star-${i}`}
              animate={{
                scale: [0.4, 1.4, 0.4],
                opacity: [0.15, 0.85, 0.15],
              }}
              transition={{
                duration: 3 + (i % 4) * 0.8,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut",
              }}
              style={{
                top: `${8 + (i * 7)}%`,
                left: `${(i * 8.5) % 92}%`,
              }}
              className="absolute w-2 h-2 rounded-full bg-indigo-300 dark:bg-emerald-200 shadow-[0_0_10px_rgba(165,180,252,0.9)]"
            />
          ))}
        </>
      )}

      {/* 4. COMPANIONS THEME: Courageous Sky/Teal Flowing Breeze & Ribbons */}
      {theme === "companions" && (
        <>
          {/* Dynamic flowing sky ribbon 1 */}
          <motion.div
            animate={{
              x: ["-50%", "50%", "-50%"],
              y: [0, 30, 0],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/6 -left-20 w-[900px] h-48 bg-gradient-to-r from-cyan-400/20 via-sky-300/30 to-teal-400/20 blur-3xl rounded-full dark:from-cyan-600/15 dark:via-sky-500/15"
          />

          {/* Dynamic flowing sky ribbon 2 */}
          <motion.div
            animate={{
              x: ["40%", "-40%", "40%"],
              y: [0, -25, 0],
              opacity: [0.12, 0.3, 0.12],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute top-1/2 -right-20 w-[800px] h-56 bg-gradient-to-l from-blue-400/20 via-teal-300/25 to-emerald-300/15 blur-3xl rounded-full dark:from-blue-600/15 dark:via-teal-500/15"
          />

          {/* Upward floating hero motes */}
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={`companions-mote-${i}`}
              initial={{
                y: "100%",
                x: `${(i * 15) % 85}%`,
                opacity: 0,
              }}
              animate={{
                y: ["100%", "-10%"],
                x: [`${(i * 15) % 85}%`, `${((i * 15) % 85) + (i % 2 === 0 ? 12 : -12)}%`],
                opacity: [0, 0.7, 0],
              }}
              transition={{
                duration: 11 + (i % 3) * 3,
                repeat: Infinity,
                delay: i * 1.5,
                ease: "linear",
              }}
              className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 dark:bg-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
            />
          ))}
        </>
      )}

      {/* 5. NATURE THEME: Refreshing Organic Green & Gentle Swaying Leaves/Orbs */}
      {theme === "nature" && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-5 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-emerald-300/30 via-lime-200/25 to-teal-300/20 blur-3xl dark:from-emerald-600/15 dark:via-lime-600/10"
          />

          {/* Soft floating nature orbs with sway */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`nature-orb-${i}`}
              animate={{
                y: [0, -60, 0],
                x: [-15, 15, -15],
                opacity: [0.2, 0.6, 0.2],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 8 + i * 1.2,
                repeat: Infinity,
                delay: i * 0.9,
                ease: "easeInOut",
              }}
              style={{
                top: `${15 + (i * 10)}%`,
                left: `${8 + (i * 11) % 85}%`,
              }}
              className="absolute w-5 h-5 rounded-full bg-emerald-400/30 dark:bg-emerald-300/20 blur-2xs"
            />
          ))}
        </>
      )}
    </div>
  );
}

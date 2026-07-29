import React from "react";
import { VolumeX, ShieldAlert, RefreshCw, BookOpen, AlertCircle, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface AudioNotAvailableNoticeProps {
  /** Main heading title. Default: "Audio Not Available" */
  title?: string;
  /** Primary reason string. Default: "Authentic audio pending verification" */
  reason?: string;
  /** Detailed explanatory message for users */
  description?: string;
  /** Visual presentation layout mode */
  variant?: "banner" | "card" | "inline" | "modal";
  /** Custom action label (e.g. "Read Text Mode") */
  actionText?: string;
  /** Callback when user clicks action button */
  onAction?: () => void;
  /** Callback when user clicks retry button */
  onRetry?: () => void;
  /** Callback to close or dismiss notice */
  onDismiss?: () => void;
  /** Additional custom class names */
  className?: string;
}

export default function AudioNotAvailableNotice({
  title = "Audio Not Available",
  reason = "Authentic audio pending verification",
  description = "To ensure 100% accuracy and proper pronunciation in Islamic learning, unverified audio streams are restricted. Clear text reading with full Arabic, transliteration, and translation is fully available.",
  variant = "banner",
  actionText = "Read Text Mode",
  onAction,
  onRetry,
  onDismiss,
  className = ""
}: AudioNotAvailableNoticeProps) {

  // Variant: Inline Badge / Alert Box
  if (variant === "inline") {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-medium shadow-xs ${className}`}>
        <VolumeX className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="font-semibold">{title}:</span>
        <span className="text-amber-700 dark:text-amber-300">{reason}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 underline underline-offset-2"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    );
  }

  // Variant: Embedded Card inside section content
  if (variant === "card") {
    return (
      <div className={`p-4 sm:p-5 rounded-2xl bg-slate-900/90 dark:bg-slate-950/95 border border-amber-500/30 text-white shadow-xl backdrop-blur-md relative overflow-hidden ${className}`}>
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start gap-3.5 relative z-10">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
            <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Notice
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Islamic Authenticity Standard
              </span>
            </div>

            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {title}
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-amber-300 mt-0.5">
              {reason}
            </p>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              {description}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {onAction && (
                <button
                  onClick={onAction}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {actionText}
                </button>
              )}
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Connection
                </button>
              )}
            </div>
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all shrink-0"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Variant: Modal Dialog
  if (variant === "modal") {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`max-w-md w-full bg-slate-900 border border-amber-500/40 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden ${className}`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <VolumeX className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-center text-slate-100">{title}</h3>
            <div className="mt-2 text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                {reason}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 text-center mt-3 leading-relaxed">
              {description}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              {onAction && (
                <button
                  onClick={onAction}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  {actionText}
                </button>
              )}
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-all border border-slate-700 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Loading Audio
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="w-full py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition-all"
                >
                  Dismiss
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // Default Variant: Player / Sticky Banner
  return (
    <div className={`p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-950 border border-amber-500/40 text-white shadow-xl backdrop-blur-lg flex items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
          <VolumeX className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Audio Status
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
              {title}
            </h4>
          </div>
          <p className="text-xs font-medium text-amber-300 truncate mt-0.5">
            {reason}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all border border-slate-700"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{actionText}</span>
            <span className="xs:hidden">Text</span>
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

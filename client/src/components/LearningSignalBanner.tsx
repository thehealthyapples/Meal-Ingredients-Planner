/**
 * LearningSignalBanner — displays a pending learning signal with confirmation actions.
 *
 * Design: calm, not intrusive. Signals are helpful insights, not urgent alerts.
 * Users can confirm/decline/skip in context at the moment of recommendation.
 *
 * EL2 §8 Gate 3 implementation: explicit household confirmation before signal influences decisions.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LearningSignal } from "@/hooks/use-learning-signals";

export interface LearningSignalBannerProps {
  signal: LearningSignal | null;
  onConfirm: (signal: LearningSignal) => void | Promise<void>;
  onDecline: (signal: LearningSignal) => void | Promise<void>;
  onSkip: () => void;
  onViewAll: () => void;
  isLoading?: boolean;
}

export function LearningSignalBanner({
  signal,
  onConfirm,
  onDecline,
  onSkip,
  onViewAll,
  isLoading = false,
}: LearningSignalBannerProps) {
  const [loadingAction, setLoadingAction] = useState<'confirm' | 'decline' | null>(null);

  if (!signal) return null;

  const handleConfirm = async () => {
    setLoadingAction('confirm');
    try {
      await onConfirm(signal);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDecline = async () => {
    setLoadingAction('decline');
    try {
      await onDecline(signal);
    } finally {
      setLoadingAction(null);
    }
  };

  const isProcessing = isLoading || loadingAction !== null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20"
      >
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            Learning Signal
          </span>
        </div>

        {/* Content */}
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {signal.rationale}
          </p>
          {signal.evidenceCount > 0 && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Based on {signal.evidenceCount} observation{signal.evidenceCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              {loadingAction === 'confirm' ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDecline}
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              {loadingAction === 'decline' ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Declining...
                </>
              ) : (
                "Decline"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onSkip}
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              Skip
            </Button>
          </div>

          {/* Link to full list */}
          <button
            onClick={onViewAll}
            disabled={isProcessing}
            className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300 sm:mt-0 sm:justify-start"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

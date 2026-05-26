'use client';

import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'info',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-[#151619]/60 backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6"
          >
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto",
              variant === 'danger' ? "bg-red-50 text-red-500" :
              variant === 'warning' ? "bg-amber-50 text-amber-500" :
              "bg-blue-50 text-blue-500"
            )}>
              <AlertTriangle size={28} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-[#151619]">{title}</h3>
              <p className="text-sm text-zinc-500 font-medium leading-relaxed">{message}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onCancel}
                className="h-12 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-xs active:scale-95 transition-all"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={cn(
                  "h-12 rounded-2xl font-black text-xs active:scale-95 transition-all shadow-lg",
                  variant === 'danger' ? "bg-red-500 text-white shadow-red-500/20" :
                  variant === 'warning' ? "bg-amber-500 text-white shadow-amber-500/20" :
                  "bg-[#12C2A2] text-white shadow-[#12C2A2]/20"
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

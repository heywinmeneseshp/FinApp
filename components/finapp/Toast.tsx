'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

let toastListeners: ((msg: ToastMessage) => void)[] = [];

export function showToast(message: string, type: ToastType = 'info') {
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  toastListeners.forEach(fn => fn({ id, type, message }));
  return id;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (msg: ToastMessage) => {
      setToasts(prev => [...prev, msg]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== msg.id));
      }, 3500);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(fn => fn !== listener);
    };
  }, []);

  const remove = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-sm",
              toast.type === 'success' ? "bg-white border-[#12C2A2]/20 text-[#12C2A2]" :
              toast.type === 'error' ? "bg-white border-red-200 text-red-600" :
              "bg-white border-blue-200 text-blue-600"
            )}
          >
            {toast.type === 'success' && <CheckCircle size={20} />}
            {toast.type === 'error' && <XCircle size={20} />}
            {toast.type === 'info' && <AlertCircle size={20} />}
            <span className="flex-1 text-sm font-bold">{toast.message}</span>
            <button
              onClick={() => remove(toast.id)}
              className="p-1 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

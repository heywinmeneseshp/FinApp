'use client';

import React from 'react';
import { Home, Tag, Package, BookOpen, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab?: string;
  onChange?: (tab: string) => void;
}

export default function BottomNav({ activeTab = 'Inicio', onChange }: BottomNavProps) {
  const tabs = [
    { label: 'Inicio', icon: <Home size={24} /> },
    { label: 'Ventas', icon: <Tag size={24} /> },
    { label: 'Inventario', icon: <Package size={24} /> },
    { label: 'Aprender', icon: <BookOpen size={24} /> },
    { label: 'Perfil', icon: <User size={24} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 px-4">
      <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] w-full max-w-lg px-2 flex justify-between items-center h-20">
        {tabs.map((tab, i) => {
          const isActive = activeTab === tab.label;
          return (
            <motion.div 
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange?.(tab.label)}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer transition-colors"
            >
              <div className={cn(
                "p-2 rounded-full relative",
                isActive ? "text-[#12C2A2]" : "text-zinc-400"
              )}>
                {tab.icon}
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#12C2A2] rounded-full"
                    />
                  )}
                </AnimatePresence>
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                isActive ? "text-[#12C2A2]" : "text-zinc-400"
              )}>
                {tab.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { ChevronLeft, GraduationCap, Archive, Bookmark } from 'lucide-react';
import { motion } from 'motion/react';

interface LearningModuleHeaderProps {
  onBack: () => void;
  onGlossary: () => void;
  progress: number;
}

export default function LearningModuleHeader({ onBack, onGlossary, progress }: LearningModuleHeaderProps) {
  return (
    <div className="flex flex-col gap-6 w-full mb-8">
      <div className="flex justify-between items-center">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="p-2 rounded-2xl bg-white border border-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors shadow-sm"
        >
          <ChevronLeft size={24} />
        </motion.button>
        <div className="flex items-center gap-3">
          <button 
            onClick={onGlossary}
            className="p-2 text-zinc-400 hover:text-[#12C2A2]"
          >
            <GlosaryIcon />
          </button>
          <button className="p-2 text-zinc-400 hover:text-[#12C2A2]">
            <Bookmark size={24} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#E3F5EE] rounded-2xl flex items-center justify-center">
            <GraduationCap size={32} className="text-[#12C2A2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#151619] tracking-tight">
              Aprende Finanzas
            </h1>
            <p className="text-zinc-500 text-sm">
              Módulo: Gestión de tu Negocio
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Progreso total</span>
            <span className="text-sm font-bold text-[#12C2A2]">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-[#12C2A2]"
            />
          </div>
          <p className="text-[11px] text-zinc-400 text-center">¡Estás más cerca de ser un experto!</p>
        </div>
      </div>
    </div>
  );
}

function GlosaryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 6h8" />
      <path d="M8 10h8" />
      <path d="M8 14h4" />
    </svg>
  );
}

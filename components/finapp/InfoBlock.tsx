'use client';

import React from 'react';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface InfoBlockProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  statusText?: string;
  statusVariant?: 'green' | 'red';
  alert?: {
    text: string;
  };
  progress?: {
    value: number;
    currentLesson: string;
  };
}

export default function InfoBlock({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconBg, 
  statusText, 
  statusVariant, 
  alert,
  progress
}: InfoBlockProps) {
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className="bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-sm flex flex-col gap-4 relative overflow-hidden"
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className={cn("w-12 h-12 rounded-[1.25rem] flex items-center justify-center", iconBg)}>
            {icon}
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-medium text-zinc-500">{title}</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#151619]">{value}</span>
              {statusText && (
                <span className={cn(
                  "flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                  statusVariant === 'green' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                )}>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    statusVariant === 'green' ? "bg-green-500" : "bg-red-500"
                  )} />
                  {statusText}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">{subtitle}</p>
          </div>
        </div>
        
        {!progress && (
          <div className="bg-zinc-50 p-2 rounded-full cursor-pointer hover:bg-zinc-100 transition-colors">
            <ChevronRight size={16} className="text-zinc-400" />
          </div>
        )}
      </div>

      {alert && (
        <div className="mt-2 flex items-center gap-2 p-3 bg-red-50/50 rounded-2xl border border-red-100">
          <AlertCircle size={14} className="text-[#E53030]" />
          <span className="text-xs font-semibold text-[#E53030]">{alert.text}</span>
          <ChevronRight size={14} className="text-[#E53030] ml-auto" />
        </div>
      )}

      {progress && (
        <div className="mt-2 flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
            <span className="text-zinc-400">Tu progreso</span>
            <span className="text-zinc-900">{progress.value}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress.value}%` }}
              className="h-full bg-[#12C2A2]"
            />
          </div>
          <div className="pt-2 border-t border-zinc-50 flex justify-between items-center group cursor-pointer">
            <span className="text-xs text-zinc-600">Continuar lección: <span className="font-bold text-[#151619]">{progress.currentLesson}</span></span>
            <ChevronRight size={14} className="text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

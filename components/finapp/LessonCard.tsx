'use client';

import React from 'react';
import { CheckCircle2, Circle, Lock, ChevronRight, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Lesson } from '@/lib/learning-data';

interface LessonCardProps {
  lesson: Lesson;
  onSelect: (lesson: Lesson) => void;
}

export default function LessonCard({ lesson, onSelect }: LessonCardProps) {
  const isBlocked = lesson.status === 'blocked';
  const isCompleted = lesson.status === 'completed';
  const isInProgress = lesson.status === 'in-progress';

  return (
    <motion.div
      whileTap={!isBlocked ? { scale: 0.98 } : {}}
      onClick={() => !isBlocked && onSelect(lesson)}
      className={cn(
        "p-5 rounded-[2rem] border transition-all relative flex flex-col gap-4",
        isBlocked 
          ? "bg-zinc-50 border-zinc-100 opacity-60 cursor-not-allowed" 
          : "bg-white border-white shadow-sm hover:border-zinc-200 cursor-pointer overflow-hidden"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center",
            isCompleted ? "bg-green-50 text-green-500" : 
            isInProgress ? "bg-blue-50 text-blue-500" : 
            "bg-zinc-200 text-zinc-400"
          )}>
            {isCompleted ? <CheckCircle2 size={24} /> : 
             isInProgress ? <Play size={24} fill="currentColor" /> : 
             <Lock size={24} />}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{lesson.category}</span>
            <h4 className="text-lg font-bold text-[#151619] tracking-tight">{lesson.title}</h4>
            <p className="text-xs text-zinc-500 line-clamp-1 pr-4">{lesson.description}</p>
          </div>
        </div>
        {!isBlocked && <ChevronRight size={20} className="text-zinc-300 mt-2" />}
      </div>

      {isInProgress && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-zinc-400">Progreso de lección</span>
            <span className="text-blue-500">{lesson.progress}%</span>
          </div>
          <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[45%]" />
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          LECCIÓN COMPLETADA
        </div>
      )}
    </motion.div>
  );
}

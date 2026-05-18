'use client';

import React, { useState } from 'react';
import LearningModuleHeader from './LearningModuleHeader';
import LessonCard from './LessonCard';
import LessonDetail from './LessonDetail';
import { learningModules, Lesson } from '@/lib/learning-data';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, BookOpen } from 'lucide-react';

import GlossaryModal from './GlossaryModal';
import Certificate from './Certificate';

interface LearningModuleProps {
  onBack: () => void;
}

export default function LearningModule({ onBack }: LearningModuleProps) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [lessons, setLessons] = useState(learningModules[0].lessons);

  const moduleProgress = Math.round(
    (lessons.filter(l => l.status === 'completed').length / lessons.length) * 100
  );

  const handleCompleteLesson = (id: string) => {
    setLessons(prev => prev.map(l => {
      if (l.id === id) return { ...l, status: 'completed', progress: 100 };
      // Normal sequential unlock
      const currentIdx = prev.findIndex(item => item.id === id);
      if (currentIdx !== -1 && currentIdx + 1 < prev.length) {
        const nextId = prev[currentIdx + 1].id;
        if (l.id === nextId && l.status === 'blocked') {
          return { ...l, status: 'in-progress' as any };
        }
      }
      return l;
    }));
    setSelectedLesson(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-32">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <LearningModuleHeader 
          onBack={onBack} 
          onGlossary={() => setShowGlossary(true)}
          progress={moduleProgress} 
        />

        <div className="flex flex-col gap-8">
          {/* Top Featured Lesson or Certificate Call */}
          {moduleProgress < 100 ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#151619] p-6 rounded-[2.5rem] text-white flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#12C2A2]/20 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#12C2A2]">RECOMENDADO</span>
                <h4 className="text-xl font-bold">Continuar aprendizaje</h4>
                <p className="text-zinc-400 text-xs">Domina las finanzas de tu negocio paso a paso.</p>
              </div>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const nextLection = lessons.find(l => l.status === 'in-progress' || l.status === 'blocked');
                  if (nextLection && nextLection.status !== 'blocked') setSelectedLesson(nextLection);
                }}
                className="w-fit px-6 py-3 bg-[#12C2A2] rounded-2xl text-sm font-bold shadow-lg shadow-[#12C2A2]/20"
              >
                Comenzar ahora
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-[#12C2A2] to-[#3068E5] p-8 rounded-[2.5rem] text-white flex flex-col gap-4 relative overflow-hidden shadow-xl"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl opacity-50" />
              <div className="flex flex-col gap-1 z-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">¡ENHORABUENA!</span>
                <h4 className="text-2xl font-black italic tracking-tight">Módulo Completado</h4>
                <p className="text-white/80 text-sm">Has demostrado ser un experto en Finanzas de Negocio.</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCertificate(true)}
                className="w-full sm:w-fit px-8 py-4 bg-white text-[#12C2A2] rounded-2xl text-base font-black shadow-2xl z-10"
              >
                Obtener Certificado
              </motion.button>
            </motion.div>
          )}
          {/* Achievements (Mock) */}
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
            <div className="flex-shrink-0 flex items-center gap-2 p-3 bg-white border border-zinc-100 rounded-2xl">
              <Trophy size={16} className="text-amber-500" />
              <span className="text-xs font-bold">Resumen Diario</span>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 p-3 bg-white border border-zinc-100 rounded-2xl opacity-40">
              <Star size={16} className="text-purple-500" />
              <span className="text-xs font-bold">Mentalidad de Oro</span>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 p-3 bg-white border border-zinc-100 rounded-2xl opacity-40 text-blue-500">
              <BookOpen size={16} />
              <span className="text-xs font-bold">Contador Pro</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-lg font-bold text-[#151619]">Lecciones disponibles</h3>
              <span className="text-xs font-bold text-zinc-400">MOD {learningModules[0].lessons.length}</span>
            </div>

            <div className="flex flex-col gap-4">
              {lessons.map((lesson) => (
                <LessonCard 
                  key={lesson.id} 
                  lesson={lesson} 
                  onSelect={setSelectedLesson} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showGlossary && (
          <GlossaryModal onClose={() => setShowGlossary(false)} />
        )}
        <AnimatePresence>
          {showCertificate && (
            <Certificate 
              userName="Emprendedor" 
              moduleTitle="Finanzas de tu Negocio" 
              date={new Date().toLocaleDateString()}
              onClose={() => setShowCertificate(false)}
            />
          )}
        </AnimatePresence>
        {selectedLesson && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60]"
          >
            <LessonDetail 
              lesson={selectedLesson} 
              onBack={() => setSelectedLesson(null)}
              onComplete={handleCompleteLesson}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

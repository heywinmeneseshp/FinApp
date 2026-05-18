'use client';

import React, { useState } from 'react';
import { ChevronLeft, CheckCircle2, ChevronRight, HelpCircle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lesson } from '@/lib/learning-data';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

interface LessonDetailProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: (id: string) => void;
}

export default function LessonDetail({ lesson, onBack, onComplete }: LessonDetailProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const totalContent = lesson.content?.length || 0;
  const totalQuiz = lesson.quiz?.length || 0;
  const totalSteps = totalContent + totalQuiz;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  const isQuiz = currentStep >= totalContent;
  const quizIndex = currentStep - totalContent;

  const handleNext = () => {
    if (isQuiz && !isAnswerChecked) {
      // First check the answer
      setIsAnswerChecked(true);
      if (quizAnswer === lesson.quiz![quizIndex].correctIndex) {
        setScore(prev => prev + 1);
      }
      return;
    }

    // Then move to next step
    if (currentStep < totalSteps - 1) {
      setCurrentStep(s => s + 1);
      setQuizAnswer(null);
      setIsAnswerChecked(false);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setQuizAnswer(null);
    setIsAnswerChecked(false);
    setScore(0);
    setShowResults(false);
  };

  const isPerfect = score === totalQuiz;

  if (showResults) {
    return (
      <div className="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-6 max-w-sm"
        >
          <div className={cn(
            "w-24 h-24 rounded-[2.5rem] mx-auto flex items-center justify-center text-4xl shadow-lg",
            isPerfect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          )}>
            {isPerfect ? '🏆' : '📚'}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[#151619]">
              {isPerfect ? '¡Excelente Trabajo!' : 'Puedes hacerlo mejor'}
            </h2>
            <p className="text-zinc-500">
              Tu calificación: <span className={cn("font-bold", isPerfect ? "text-green-600" : "text-red-600")}>
                {score} de {totalQuiz}
              </span>
            </p>
          </div>

          <div className="p-4 bg-zinc-50 rounded-2xl text-sm italic text-zinc-500">
            {isPerfect 
              ? 'Has dominado esta lección. ¡Estás listo para el siguiente reto!' 
              : 'Revisa los conceptos e intenta de nuevo para desbloquear el progreso.'}
          </div>

          <div className="flex flex-col gap-3">
            {isPerfect ? (
              <button
                onClick={() => onComplete(lesson.id)}
                className="w-full py-4 bg-[#12C2A2] text-white rounded-2xl font-bold shadow-xl shadow-[#12C2A2]/20"
              >
                Finalizar y Continuar
              </button>
            ) : (
              <button
                onClick={handleRestart}
                className="w-full py-4 bg-[#151619] text-white rounded-2xl font-bold shadow-xl shadow-zinc-900/20"
              >
                Repetir Lección
              </button>
            )}
            <button
              onClick={onBack}
              className="w-full py-4 text-zinc-500 font-bold"
            >
              Salir por ahora
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const downloadLessonSummary = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(lesson.title, 20, 20);
    doc.setFontSize(12);
    doc.text(`Categoría: ${lesson.category}`, 20, 30);
    
    let y = 50;
    doc.setFontSize(14);
    doc.text("Resumen de Contenido:", 20, y);
    y += 10;
    
    doc.setFontSize(11);
    lesson.content.forEach((item) => {
      if (typeof item.value === 'string') {
        const text = item.type === 'tip' ? `CONSEJO: ${item.value}` : item.value;
        const lines = doc.splitTextToSize(text, 170);
        doc.text(lines, 20, y);
        y += (lines.length * 7) + 5;
      }
    });

    doc.save(`Resumen_${lesson.title.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 border-b border-zinc-50">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="p-2 rounded-xl text-zinc-600"
        >
          <ChevronLeft size={24} />
        </motion.button>
        <div className="flex-1 px-4">
          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-[#12C2A2]"
            />
          </div>
        </div>
        <button 
          onClick={downloadLessonSummary}
          className="p-2 text-zinc-400 hover:text-[#12C2A2] transition-colors"
        >
          <Download size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {!isQuiz ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#12C2A2] uppercase tracking-[0.2em]">{lesson.category}</span>
                <h2 className="text-2xl font-bold text-[#151619] leading-tight">{lesson.title}</h2>
              </div>

              {lesson.content[currentStep]?.type === 'text' && (
                <p className="text-zinc-600 leading-relaxed text-lg">
                  {lesson.content[currentStep].value}
                </p>
              )}

              {lesson.content[currentStep]?.type === 'example' && (
                <div className="p-6 bg-[#F2F7FF] rounded-3xl border border-blue-50 space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <HelpCircle size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Ejemplo Práctico</span>
                  </div>
                  <p className="text-blue-900 font-medium leading-relaxed">
                    {lesson.content[currentStep].value}
                  </p>
                </div>
              )}

              {lesson.content[currentStep]?.type === 'tip' && (
                <div className="p-6 bg-[#F2FAF7] rounded-3xl border border-[#D9F2E9] space-y-3">
                  <div className="flex items-center gap-2 text-[#12C2A2]">
                    <CheckCircle2 size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Consejo Pro</span>
                  </div>
                  <p className="text-[#0D8A73] font-medium leading-relaxed">
                    {lesson.content[currentStep].value}
                  </p>
                </div>
              )}

              {lesson.content[currentStep]?.type === 'diagram' && (
                <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-full flex justify-between items-center px-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <ChevronRight className="rotate-[-45deg]" />
                        </div>
                        <span className="text-[10px] font-bold">ENTRADAS</span>
                    </div>
                    <div className="flex-1 h-px bg-zinc-200 mx-4" />
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                            <ChevronRight className="rotate-[45deg]" />
                        </div>
                        <span className="text-[10px] font-bold">SALIDAS</span>
                    </div>
                  </div>
                  <p className="text-zinc-400 italic text-xs">
                    {lesson.content[currentStep].value}
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="p-6 bg-[#F7F2FF] rounded-3xl border border-purple-50">
                <h3 className="text-xl font-bold text-purple-900 leading-tight">
                  {lesson.quiz![quizIndex].question}
                </h3>
              </div>

              <div className="space-y-3">
                {lesson.quiz![quizIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    disabled={isAnswerChecked}
                    onClick={() => setQuizAnswer(idx)}
                    className={cn(
                      "w-full p-5 rounded-2xl border text-left transition-all font-medium",
                      quizAnswer === idx 
                        ? isAnswerChecked
                          ? quizAnswer === lesson.quiz![quizIndex].correctIndex 
                            ? "bg-green-50 border-green-200 text-green-900"
                            : "bg-red-50 border-red-200 text-red-900"
                          : "bg-blue-50 border-blue-200 text-blue-900 ring-2 ring-blue-100"
                        : "bg-white border-zinc-100 text-zinc-700 hover:border-zinc-300"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {isAnswerChecked && quizAnswer !== null && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed",
                    quizAnswer === lesson.quiz![quizIndex].correctIndex 
                      ? "bg-green-100/50 text-green-800"
                      : "bg-red-100/50 text-red-800"
                  )}
                >
                  <p className="font-bold mb-1">
                    {quizAnswer === lesson.quiz![quizIndex].correctIndex ? '¡Correcto!' : 'Incorrecto'}
                  </p>
                  {lesson.quiz![quizIndex].explanation}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Area */}
      <div className="p-6 bg-white border-t border-zinc-50">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={isQuiz && quizAnswer === null}
          className={cn(
            "w-full py-5 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 shadow-xl transition-all",
            isQuiz && quizAnswer === null 
              ? "bg-zinc-100 text-zinc-400 shadow-none cursor-not-allowed" 
              : "bg-[#12C2A2] text-white shadow-[#12C2A2]/20"
          )}
        >
          {isQuiz 
            ? isAnswerChecked 
              ? currentStep === totalSteps - 1 ? 'Ver resultados' : 'Siguiente'
              : 'Comprobar respuesta'
            : currentStep === totalSteps - 1 ? 'Finalizar Lección' : 'Continuar'}
          <ChevronRight size={20} />
        </motion.button>
      </div>
    </div>
  );
}

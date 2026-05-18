'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, BookOpen, ChevronRight, 
  Play, CheckCircle, Clock, Award,
  Sparkles, BrainCircuit, Rocket
} from 'lucide-react';
import { useFinanceStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface LearningModuleProps {
  onBack: () => void;
}

const LESSONS = [
  {
    id: '1',
    title: 'Fundamentos de Caja',
    duration: '10 min',
    level: 'Principiante',
    description: 'Aprende la diferencia entre flujo de caja y rentabilidad.',
    content: `
# Flujo de Caja vs. Rentabilidad

Es común confundir "tener dinero en el bolsillo" con "estoy ganando dinero". 

### 1. El Flujo de Caja (Cash Flow)
Es el dinero que entra y sale de tu negocio. Si vendes $1000 y gastas $800, tu flujo es de $200.

### 2. La Rentabilidad
Es lo que te queda después de pagar todos los costos fijos y variables. 

**Tip Pro:** Nunca uses el dinero de las ventas para gastos personales antes de separar el costo de reposición de la mercadería.
    `
  },
  {
    id: '2',
    title: 'Fijación de Precios',
    duration: '15 min',
    level: 'Intermedio',
    description: 'Cómo calcular tu margen de ganancia real.',
    content: `
# ¿Cómo ponerle precio a tus productos?

Muchos emprendedores simplemente multiplican el costo por 2. Pero, ¿es suficiente?

### La fórmula del Margen
Precio = Costo / (1 - Margen Deseado)

Ejemplo: Si te cuesta $10 y quieres un margen del 30%:
10 / 0.7 = $14.28

**No olvides incluir:**
- Costo de envío
- Embalaje
- Comisiones de pasarelas de pago
    `
  },
  {
    id: '3',
    title: 'Escalando tu Negocio',
    duration: '20 min',
    level: 'Avanzado',
    description: 'Estrategias para reinvertir tus utilidades.',
    content: `
# ¿Cuándo reinvertir?

Si tu negocio ya es rentable, es hora de crecer.

### Regla del 30/70
Destina el 30% de tus utilidades a crecimiento y el 70% a reserva o retiro.

**Dónde invertir:**
- Marketing digital (ads)
- Mejora de procesos
- Nuevos canales de venta
    `
  }
];

export default function LearningModule({ onBack }: LearningModuleProps) {
  const { lessonsProgress, updateLessonProgress } = useFinanceStore();
  const [selectedLesson, setSelectedLesson] = useState<typeof LESSONS[0] | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white min-h-[70vh] rounded-[3rem] shadow-sm overflow-hidden flex flex-col"
    >
      <div className="p-6 bg-[#151619] text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => selectedLesson ? setSelectedLesson(null) : onBack()} className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-xl font-bold">{selectedLesson ? 'Lección' : 'Academia FinApp'}</h2>
        </div>
        {!selectedLesson && (
          <div className="bg-[#12C2A2]/10 text-[#12C2A2] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#12C2A2]/20">
            Nivel: Diamante
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {selectedLesson ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-50 p-8 rounded-[3rem] border border-zinc-100">
              <div className="markdown-body prose prose-zinc max-w-none">
                <ReactMarkdown>{selectedLesson.content}</ReactMarkdown>
              </div>
              <button 
                onClick={() => {
                  updateLessonProgress(selectedLesson.id, 'completed', 100);
                  setSelectedLesson(null);
                }}
                className="w-full bg-[#12C2A2] text-white py-5 rounded-[2rem] font-black tracking-widest uppercase mt-8 shadow-xl shadow-[#12C2A2]/20 flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Completar Lección
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-[#151619] to-zinc-800 p-8 rounded-[3rem] text-white relative overflow-hidden">
               <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/5" />
               <h3 className="text-2xl font-black mb-2">Tu camino al éxito</h3>
               <p className="text-zinc-400 text-sm mb-6">Aprende finanzas prácticas diseñadas para emprendedores reales como tú.</p>
               <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md">
                     <Award className="text-[#12C2A2]" size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#12C2A2]">Progreso Total</p>
                    <p className="text-2xl font-black">40% completado</p>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-4">Cursos disponibles</h4>
              {LESSONS.map((lesson) => {
                const progress = lessonsProgress[lesson.id];
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className="w-full bg-zinc-50 p-6 rounded-[2.5rem] border border-zinc-100 flex items-center justify-between hover:bg-white hover:border-[#12C2A2] hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-3xl flex items-center justify-center shadow-sm transition-all",
                        progress?.status === 'completed' ? "bg-[#F2FAF7] text-[#12C2A2]" : "bg-white text-zinc-300 group-hover:text-[#12C2A2]"
                      )}>
                        {progress?.status === 'completed' ? <CheckCircle size={28} /> : <Play size={24} />}
                      </div>
                      <div className="text-left">
                        <h5 className="font-bold text-[#151619]">{lesson.title}</h5>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] bg-zinc-200 px-2 py-0.5 rounded-lg font-bold text-zinc-500 flex items-center gap-1 uppercase tracking-tighter">
                            <Clock size={10} /> {lesson.duration}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">
                            {lesson.level}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-zinc-300 group-hover:text-[#12C2A2] transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

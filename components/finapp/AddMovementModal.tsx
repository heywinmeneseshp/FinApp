'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, TrendingUp, ArrowDownCircle } from 'lucide-react';
import { useFinanceStore } from '@/lib/store';

interface AddMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddMovementModal({ isOpen, onClose }: AddMovementModalProps) {
  const [type, setType] = useState<'ingreso' | 'gasto'>('ingreso');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const { addMovement } = useFinanceStore();

  const handleSave = () => {
    if (!amount || isNaN(Number(amount))) return;
    addMovement({
      type,
      amount: Number(amount),
      description,
      category: type === 'ingreso' ? 'Venta' : 'Operativo'
    });
    setAmount('');
    setDescription('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#151619]/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 z-10 relative shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Registrar Movimiento</h2>
              <button onClick={onClose} type="button" className="p-2 bg-zinc-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="flex flex-col gap-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setType('ingreso')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${type === 'ingreso' ? 'border-[#12C2A2] bg-[#F2FAF7]' : 'border-zinc-100 bg-white'}`}
                >
                  <TrendingUp className={type === 'ingreso' ? 'text-[#12C2A2]' : 'text-zinc-400'} />
                  <span className={`text-sm font-bold ${type === 'ingreso' ? 'text-[#12C2A2]' : 'text-zinc-400'}`}>Entrada</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setType('gasto')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${type === 'gasto' ? 'border-[#E53030] bg-[#FFF2F2]' : 'border-zinc-100 bg-white'}`}
                >
                  <ArrowDownCircle className={type === 'gasto' ? 'text-[#E53030]' : 'text-zinc-400'} />
                  <span className={`text-sm font-bold ${type === 'gasto' ? 'text-[#E53030]' : 'text-zinc-400'}`}>Salida</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase ml-2">Monto ($)</label>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-xl font-bold focus:ring-2 focus:ring-[#3068E5] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase ml-2">Descripción</label>
                <input 
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="¿En qué consistió?"
                  className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-medium focus:ring-2 focus:ring-[#3068E5] transition-all"
                />
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-5 bg-[#151619] text-white rounded-3xl font-bold flex items-center justify-center gap-2 shadow-xl mt-4"
              >
                <Save size={20} />
                Guardar Registro
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

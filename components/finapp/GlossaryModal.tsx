'use client';

import React, { useState } from 'react';
import { Search, X, ChevronRight, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { glossary } from '@/lib/learning-data';

interface GlossaryModalProps {
  onClose: () => void;
}

export default function GlossaryModal({ onClose }: GlossaryModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = glossary.filter(item => 
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 flex flex-col gap-6 max-h-[80vh]"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
              <Book size={20} />
            </div>
            <h2 className="text-xl font-bold">Glosario Financiero</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-50 rounded-full">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Busca un término (ej: ROI)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#12C2A2]/20"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {filtered.length > 0 ? filtered.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 bg-zinc-50 rounded-2xl space-y-1"
            >
              <h4 className="font-bold text-[#151619]">{item.term}</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.definition}</p>
            </motion.div>
          )) : (
            <div className="py-12 text-center text-zinc-400">
              <p>No se encontraron términos para &quot;{searchTerm}&quot;</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

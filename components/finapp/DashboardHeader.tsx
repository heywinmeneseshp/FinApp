'use client';

import React from 'react';
import { Bell, User, Store } from 'lucide-react';
import { motion } from 'motion/react';

export default function DashboardHeader() {
  return (
    <div className="flex flex-col gap-6 w-full mb-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            <span className="text-[#151619]">Fin</span>
            <span className="text-[#12C2A2]">App</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <motion.div 
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full hover:bg-zinc-100 cursor-pointer relative"
          >
            <Bell size={24} className="text-[#151619]" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#12C2A2] border-2 border-white rounded-full"></span>
          </motion.div>
          <motion.div 
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center cursor-pointer border border-blue-100"
          >
            <User size={20} className="text-blue-500" />
          </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-14 h-14 bg-[#E7F0FF] rounded-2xl flex items-center justify-center">
          <Store size={32} className="text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#151619] tracking-tight">
            Hola, Emprendedor
          </h1>
          <p className="text-zinc-500 text-sm">
            Este es el resumen de tu negocio hoy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

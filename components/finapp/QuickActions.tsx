'use client';

import React, { useState } from 'react';
import { ShoppingCart, Package, BarChart2, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import AddMovementModal from './AddMovementModal';

interface QuickActionsProps {
  onSalesOpen?: () => void;
  onInventoryOpen?: () => void;
}

export default function QuickActions({ onSalesOpen, onInventoryOpen }: QuickActionsProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  const actions = [
    { label: 'Registrar venta', icon: <ShoppingCart size={24} />, bg: 'bg-[#F2FAF7]', color: 'text-[#12C2A2]', onClick: onSalesOpen },
    { label: 'Inventario', icon: <Package size={24} />, bg: 'bg-[#F2F7FF]', color: 'text-[#3068E5]', onClick: onInventoryOpen },
    { label: 'Ver reportes', icon: <BarChart2 size={24} />, bg: 'bg-[#F7F2FF]', color: 'text-[#7C30E5]' },
    { label: 'Aprender', icon: <BookOpen size={24} />, bg: 'bg-[#FFF2F2]', color: 'text-[#E53030]' },
  ];

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        <h3 className="text-lg font-bold text-[#151619]">Accesos rápidos</h3>
        <div className="grid grid-cols-4 gap-3">
          {actions.map((action, i) => (
            <motion.div 
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={action.onClick}
              className="flex flex-col items-center gap-3"
            >
              <div className={cn(
                "w-full aspect-square rounded-[1.75rem] flex items-center justify-center cursor-pointer shadow-sm border border-white/50",
                action.bg,
                action.color
              )}>
                {action.icon}
              </div>
              <span className="text-[11px] font-bold text-zinc-600 text-center leading-tight">
                {action.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      <AddMovementModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </>
  );
}

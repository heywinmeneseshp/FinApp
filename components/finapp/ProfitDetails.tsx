'use client';

import React from 'react';
import { motion } from 'motion/react';
import { X, TrendingUp, TrendingDown, Scale, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useFinanceStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface ProfitDetailsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfitDetails({ isOpen, onClose }: ProfitDetailsProps) {
  const { movements, accountsReceivable, getTotals } = useFinanceStore();
  const totals = getTotals();

  // Calculation Breakdown
  const cashSales = movements.filter(m => m.type === 'ingreso' && m.category === 'Venta').reduce((acc, m) => acc + m.amount, 0);
  const creditSales = accountsReceivable.reduce((acc, a) => acc + (a.amount || 0), 0);
  const totalSales = cashSales + creditSales;

  const cogs = movements.filter(m => m.category === 'Venta').reduce((acc, m) => {
    return acc + (m.items?.reduce((iAcc, item) => iAcc + ((item.cost || 0) * item.quantity), 0) || 0);
  }, 0);

  const operativeExpenses = movements.filter(m => 
    m.type === 'gasto' && 
    m.category !== 'Compra de Inventario' && 
    m.category !== 'Pago a Proveedor'
  ).reduce((acc, m) => acc + m.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <Scale size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#151619]">Estado de Resultados</h2>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Utilidad Neta del Negocio</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6">
          {/* Main Result Card */}
          <div className="bg-[#151619] p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <PieChart size={120} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Utilidad Neta Final</p>
              <h3 className="text-4xl font-black mb-2">{formatCurrency(totals.netProfit)}</h3>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-black uppercase",
                  totals.netProfit >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                )}>
                  {totals.netProfit >= 0 ? 'Rentabilidad Positiva' : 'Pérdida Operativa'}
                </span>
                <span className="text-[10px] text-zinc-500 font-bold">Aproximado según registros</span>
              </div>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="space-y-4">
            {/* Ventas */}
            <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#151619]">Ventas Brutas (+)</p>
                    <p className="text-[9px] font-bold text-zinc-400">Total ingresos por ventas</p>
                  </div>
                </div>
                <p className="text-lg font-black text-green-600">{formatCurrency(totalSales)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pl-12">
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Efectivo/Banco</p>
                  <p className="text-xs font-black text-[#151619]">{formatCurrency(cashSales)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">A Crédito</p>
                  <p className="text-xs font-black text-[#151619]">{formatCurrency(creditSales)}</p>
                </div>
              </div>
            </div>

            {/* COGS */}
            <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 flex justify-between items-center group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 group-hover:rotate-12 transition-transform">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-[#151619]">Costo de Ventas (-)</p>
                  <p className="text-[9px] font-bold text-zinc-400">Lo que te costó la mercancia vendida</p>
                </div>
              </div>
              <p className="text-lg font-black text-orange-600">-{formatCurrency(cogs)}</p>
            </div>

            {/* Operative Expenses */}
            <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-4">
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 group-hover:-rotate-12 transition-transform">
                    <ArrowDownRight size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#151619]">Gastos Operativos (-)</p>
                    <p className="text-[9px] font-bold text-zinc-400">Arriendos, nómina, servicios, etc.</p>
                  </div>
                </div>
                <p className="text-lg font-black text-red-600">-{formatCurrency(operativeExpenses)}</p>
              </div>

              {movements.filter(m => m.type === 'gasto' && m.category !== 'Compra de Inventario' && m.category !== 'Pago a Proveedor').length > 0 && (
                <div className="pt-2 border-t border-zinc-200/50 space-y-2">
                  {movements
                    .filter(m => m.type === 'gasto' && m.category !== 'Compra de Inventario' && m.category !== 'Pago a Proveedor')
                    .slice(-5)
                    .map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px]">
                        <span className="text-zinc-500 font-medium">{m.description}</span>
                        <span className="text-zinc-900 font-black">{formatCurrency(m.amount)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-50 p-6 rounded-3xl border border-dashed border-zinc-200">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <PieChart size={14} />
              <p className="text-[9px] font-black uppercase tracking-widest">Resumen de Margen</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-xs font-bold text-zinc-600">Margen sobre ventas</p>
                <p className="text-xl font-black text-[#151619]">
                  {totalSales > 0 ? ((totals.netProfit / totalSales) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, (totals.netProfit / totalSales) * 100))}%` }}
                  className="h-full bg-purple-600"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 pt-4">
          <button 
            onClick={onClose}
            className="w-full bg-[#151619] text-white h-14 rounded-2xl font-black hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 active:scale-95"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

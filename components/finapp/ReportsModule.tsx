'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, TrendingUp, ArrowDownCircle, Search, 
  Calendar, Filter, FileText, Download, ChevronRight,
  PieChart, BarChart3, Clock, Tag, User, Box, Sparkles, X, Plus, CreditCard
} from 'lucide-react';
import { useFinanceStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface ReportsModuleProps {
  onBack: () => void;
  initialType?: 'ingreso' | 'gasto';
}

type ReportType = 'ingreso' | 'gasto';

export default function ReportsModule({ onBack, initialType = 'ingreso' }: ReportsModuleProps) {
  const { movements, getTotals, accounts } = useFinanceStore();
  const [activeType, setActiveType] = useState<ReportType>(initialType);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const filteredMovements = useMemo(() => {
    const processedMovements: any[] = [];
    
    movements.forEach(m => {
      if (activeType === 'ingreso') {
        // Reporte de Entradas
        if (m.type === 'ingreso') {
          // Todo lo que sea tipo 'ingreso' es una entrada financiera (y física si es ajuste)
          processedMovements.push({ ...m, displayAmount: m.amount });
        } else if (m.category === 'Compra de Inventario') {
          // Una compra es una ENTRADA física de inventario aunque sea un gasto financiero
          processedMovements.push({
            ...m,
            id: `${m.id}-physical-entry`,
            displayAmount: m.amount,
            description: `Entrada de Inventario (${m.description})`,
            category: 'Entrada de Stock',
            isInventoryEntry: true
          });
        }
      } else {
        // Reporte de Salidas
        if (m.type === 'gasto') {
          processedMovements.push({ ...m, displayAmount: m.amount });
        } else if (m.category === 'Venta') {
          // Una venta es una salida física de inventario (Costo de Ventas)
          const costValue = m.items?.reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0) || 0;
          if (costValue > 0) {
            processedMovements.push({
              ...m,
              id: `${m.id}-cost`,
              displayAmount: costValue,
              description: `Salida de Inventario (${m.description})`,
              category: 'Costo de Ventas',
              isInventoryExit: true
            });
          }
        }
      }
    });

    return processedMovements.filter(m => {
      const mDate = new Date(m.date).toISOString().split('T')[0];
      const isInRange = (!dateRange.start || mDate >= dateRange.start) && 
                       (!dateRange.end || mDate <= dateRange.end);
      const matchesSearch = m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || m.category === selectedCategory;
      
      return isInRange && matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, activeType, dateRange, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const processedCats = movements.flatMap(m => {
      const cats: string[] = [];
      if (activeType === 'ingreso') {
        if (m.type === 'ingreso') cats.push(m.category);
        if (m.category === 'Compra de Inventario') cats.push('Entrada de Stock');
      } else {
        if (m.type === 'gasto') cats.push(m.category);
        if (m.category === 'Venta') cats.push('Costo de Ventas');
      }
      return cats;
    });
    return ['Todas', ...Array.from(new Set(processedCats))];
  }, [movements, activeType]);

  const totals = useMemo(() => {
    return filteredMovements.reduce((acc, m) => acc + (m.displayAmount || 0), 0);
  }, [filteredMovements]);

  const formatCurrency = (amount: number) => {
    return '$' + amount.toLocaleString();
  };

  const getMovementIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('venta')) return <Box size={20} />;
    if (cat.includes('compra')) return <Search size={20} />;
    if (cat.includes('stock')) return <Box size={20} />;
    if (cat.includes('costo')) return <Box size={20} />;
    if (cat.includes('ajuste')) return <Clock size={20} />;
    if (cat.includes('pago')) return <CreditCard size={20} />;
    return <Tag size={20} />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 bg-[#F8F9FA] z-50 flex flex-col pt-safe"
    >
      {/* Header */}
      <div className={cn(
        "p-6 text-white flex flex-col gap-6 rounded-b-[2.5rem] shadow-xl transition-colors duration-500",
        activeType === 'ingreso' ? "bg-[#12C2A2]" : "bg-[#E53030]"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              type="button"
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-xl font-black">Informes</h2>
          </div>
          <div className="flex bg-white/10 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveType('ingreso')}
              type="button"
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeType === 'ingreso' ? "bg-white text-[#12C2A2]" : "text-white/60"
              )}
            >
              Entradas
            </button>
            <button 
              onClick={() => setActiveType('gasto')}
              type="button"
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeType === 'gasto' ? "bg-white text-[#E53030]" : "text-white/60"
              )}
            >
              Salidas
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Total en Periodo</p>
          <div className="flex items-center gap-3">
            <h3 className="text-4xl font-black">{formatCurrency(totals)}</h3>
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              {activeType === 'ingreso' ? <TrendingUp size={20} /> : <ArrowDownCircle size={20} />}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        {/* Filters */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                type="button"
                className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-2 transition-all",
                  selectedCategory === cat 
                    ? (activeType === 'ingreso' ? "bg-[#12C2A2] border-[#12C2A2] text-white" : "bg-[#E53030] border-[#E53030] text-white")
                    : "bg-white border-zinc-100 text-zinc-400"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Desde</label>
              <input 
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full bg-white border border-zinc-100 rounded-2xl p-4 text-xs font-bold text-zinc-600 focus:ring-2 focus:ring-[#12C2A2] outline-none shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Hasta</label>
              <input 
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-full bg-white border border-zinc-100 rounded-2xl p-4 text-xs font-bold text-zinc-600 focus:ring-2 focus:ring-[#12C2A2] outline-none shadow-sm"
              />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar movimientos..."
              className="w-full bg-white border border-zinc-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-sm placeholder:text-zinc-300 shadow-sm outline-none focus:ring-2 focus:ring-[#12C2A2]"
            />
          </div>
        </div>

        {/* Movements List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Listado Detallado</h4>
            <div className="flex items-center gap-2 text-zinc-300">
               <FileText size={14} />
               <span className="text-[10px] font-bold">{filteredMovements.length} Registros</span>
            </div>
          </div>

          {filteredMovements.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-zinc-100 border-dashed space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto text-zinc-200">
                <Search size={32} />
              </div>
              <p className="text-zinc-400 font-bold text-sm">No se encontraron movimientos con los filtros seleccionados</p>
              <button 
                onClick={() => {
                  setDateRange({ start: '', end: '' });
                  setSearchTerm('');
                  setSelectedCategory('Todas');
                }}
                className="text-[#12C2A2] text-xs font-black uppercase tracking-widest hover:underline"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMovements.map((m) => (
                <motion.div 
                  layout
                  key={m.id}
                  className="bg-white p-5 rounded-[2.5rem] border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-[#12C2A2] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                      activeType === 'ingreso' ? "bg-[#F2FAF7] text-[#12C2A2]" : "bg-[#FFF2F2] text-[#E53030]"
                    )}>
                      {getMovementIcon(m.category)}
                    </div>
                    <div>
                      <h5 className="font-bold text-[#151619] line-clamp-1">{m.description}</h5>
                      
                      {m.items && m.items.length > 0 && (
                        <div className="mt-2 space-y-1 border-l-2 border-zinc-100 pl-3">
                          {m.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold">
                               <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 text-[8px]">{item.quantity}x</span>
                               <span>{item.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-black uppercase text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-100">
                          {m.category}
                        </span>
                        {m.accountId && (
                          <span className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                            accounts.find(a => a.id === m.accountId)?.color 
                              ? `text-zinc-500 bg-transparent`
                              : `text-zinc-400 bg-zinc-50 border-zinc-100`
                          )}
                          style={accounts.find(a => a.id === m.accountId)?.color ? { 
                            borderColor: accounts.find(a => a.id === m.accountId)?.color,
                            color: accounts.find(a => a.id === m.accountId)?.color 
                          } : {}}
                          >
                            {accounts.find(a => a.id === m.accountId)?.name || 'Cuenta'}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {new Date(m.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-base font-black transition-all group-hover:scale-110 origin-right",
                      activeType === 'ingreso' ? "text-[#12C2A2]" : "text-[#E53030]"
                    )}>
                      {activeType === 'ingreso' ? '+' : '-'}{formatCurrency(m.displayAmount)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Summary Bar */}
      {filteredMovements.length > 0 && (
        <div className="p-6 bg-white border-t border-zinc-100 safe-area-bottom">
          <button 
            type="button"
            className="w-full bg-[#151619] text-white py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
          >
            <Download size={18} />
            Exportar PDF
          </button>
        </div>
      )}
    </motion.div>
  );
}

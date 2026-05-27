'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Plus, CheckCircle2, AlertCircle,
  Clock, Wallet, Search, Building2, Filter
} from 'lucide-react';
import { useFinanceStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import ConfirmModal from './ConfirmModal';

interface AccountsPayableModuleProps {
  onBack: () => void;
}

export default function AccountsPayableModule({ onBack }: AccountsPayableModuleProps) {
  const { accountsPayable, accounts, payAccountPayable } = useFinanceStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');
  const [payModal, setPayModal] = useState<{ isOpen: boolean; apId: string; supplierName: string; pending: number }>({ isOpen: false, apId: '', supplierName: '', pending: 0 });
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'bank'>('cash');
  const [payAccountId, setPayAccountId] = useState(accounts[0]?.id || '');
  const [confirmPay, setConfirmPay] = useState(false);

  const filtered = accountsPayable
    .filter(ap => filter === 'all' || ap.status === filter)
    .filter(ap =>
      !search || ap.supplierName.toLowerCase().includes(search.toLowerCase()) || ap.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totals = {
    total: filtered.reduce((s, ap) => s + ap.amount, 0),
    paid: filtered.reduce((s, ap) => s + ap.paidAmount, 0),
    pending: filtered.reduce((s, ap) => s + (ap.amount - ap.paidAmount), 0),
  };

  const statusBadge = (status: string) => {
    if (status === 'paid') return 'bg-[#F2FAF7] text-[#12C2A2]';
    if (status === 'partial') return 'bg-amber-50 text-amber-600';
    return 'bg-red-50 text-red-500';
  };

  const openPayModal = (ap: typeof accountsPayable[0]) => {
    setPayModal({ isOpen: true, apId: ap.id, supplierName: ap.supplierName, pending: ap.amount - ap.paidAmount });
    setPayAmount('');
    setPayMethod('cash');
    setPayAccountId(accounts[0]?.id || '');
    setConfirmPay(false);
  };

  const handlePay = () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0 || amount > payModal.pending) return;
    payAccountPayable(payModal.apId, amount, payMethod, payAccountId || undefined);
    setPayModal({ isOpen: false, apId: '', supplierName: '', pending: 0 });
  };

  const tabs = [
    { id: 'all' as const, label: 'Todas', count: accountsPayable.length },
    { id: 'pending' as const, label: 'Pendientes', count: accountsPayable.filter(ap => ap.status === 'pending' || ap.status === 'partial').length },
    { id: 'paid' as const, label: 'Pagadas', count: accountsPayable.filter(ap => ap.status === 'paid').length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onBack} />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-[#F8F9FA] rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-y-auto max-h-[92vh] p-6 space-y-6"
      >
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-[#12C2A2] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="min-w-0 text-xl sm:text-2xl font-black text-[#151619] leading-tight">
          Cuentas por Pagar
        </h2>
      </div>

      {/* Resumen */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Por Pagar</p>
          <p className="text-lg font-black text-[#151619]">${totals.pending.toLocaleString()}</p>
        </div>
        <div className="text-center border-x border-zinc-100">
          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Pagado</p>
          <p className="text-lg font-black text-[#12C2A2]">${totals.paid.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total</p>
          <p className="text-lg font-black text-[#151619]">${totals.total.toLocaleString()}</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar proveedor..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-zinc-100 text-sm font-bold shadow-sm focus:outline-none focus:border-[#12C2A2] transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              filter === tab.id
                ? "bg-[#151619] text-white shadow-lg"
                : "bg-white text-zinc-400 border border-zinc-100 hover:border-zinc-200"
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white p-12 rounded-[2.5rem] border border-zinc-100 shadow-sm text-center">
            <Building2 size={40} className="text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-400">No hay cuentas por pagar</p>
          </div>
        )}
        {filtered.map(ap => {
          const pending = ap.amount - ap.paidAmount;
          const progress = ap.amount > 0 ? (ap.paidAmount / ap.amount) * 100 : 0;
          const overdue = new Date(ap.dueDate) < new Date() && ap.status !== 'paid';
          return (
            <motion.div
              key={ap.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#151619] truncate">{ap.supplierName}</h4>
                    <p className="text-[10px] text-zinc-400 font-bold truncate">{ap.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {overdue && <AlertCircle size={14} className="text-red-500" />}
                  <span className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest", statusBadge(ap.status))}>
                    {ap.status === 'paid' ? 'Pagado' : ap.status === 'partial' ? 'Parcial' : 'Pendiente'}
                  </span>
                </div>
              </div>

              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-lg font-black text-[#151619]">${pending.toLocaleString()}</p>
                  <p className={cn("text-[9px] font-bold", overdue ? "text-red-500" : "text-zinc-400")}>
                    Vence: {new Date(ap.dueDate).toLocaleDateString()}
                    {overdue && ' (Vencido)'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-500">${ap.amount.toLocaleString()}</p>
                  <p className="text-[9px] text-[#12C2A2] font-bold">${ap.paidAmount.toLocaleString()} pagado</p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="w-full h-1.5 bg-zinc-100 rounded-full mb-3">
                <div className={cn("h-full rounded-full transition-all", overdue ? "bg-red-500" : "bg-[#12C2A2]")}
                  style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>

              {ap.status !== 'paid' && (
                <button
                  onClick={() => openPayModal(ap)}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] border",
                    overdue
                      ? "border-red-500 text-red-500 hover:bg-red-50"
                      : "border-[#12C2A2] text-[#12C2A2] hover:bg-[#F2FAF7]"
                  )}
                >
                  Registrar Pago
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Modal de pago */}
      <AnimatePresence>
        {payModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => !confirmPay && setPayModal({ isOpen: false, apId: '', supplierName: '', pending: 0 })}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-6 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-black text-[#151619] mb-1">Registrar Pago</h3>
              <p className="text-xs text-zinc-400 font-bold mb-5">{payModal.supplierName}</p>

              {!confirmPay ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Monto a pagar</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      max={payModal.pending}
                      placeholder={`Máx: $${payModal.pending.toLocaleString()}`}
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 text-sm font-bold bg-zinc-50 focus:outline-none focus:border-[#12C2A2] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Método</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPayMethod('cash')}
                        className={cn("py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          payMethod === 'cash' ? 'bg-[#151619] text-white border-[#151619]' : 'bg-white text-zinc-400 border-zinc-200'
                        )}
                      >
                        Efectivo
                      </button>
                      <button
                        onClick={() => setPayMethod('bank')}
                        className={cn("py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          payMethod === 'bank' ? 'bg-[#151619] text-white border-[#151619]' : 'bg-white text-zinc-400 border-zinc-200'
                        )}
                      >
                        Banco
                      </button>
                    </div>
                  </div>
                  {accounts.length > 0 && (
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Cuenta</label>
                      <select
                        value={payAccountId}
                        onChange={e => setPayAccountId(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-zinc-200 text-sm font-bold bg-zinc-50 focus:outline-none focus:border-[#12C2A2] transition-colors"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setPayModal({ isOpen: false, apId: '', supplierName: '', pending: 0 })}
                      className="flex-1 py-3 rounded-2xl border border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        const amount = Number(payAmount);
                        if (!amount || amount <= 0 || amount > payModal.pending) return;
                        setConfirmPay(true);
                      }}
                      disabled={!payAmount || Number(payAmount) <= 0 || Number(payAmount) > payModal.pending}
                      className="flex-1 py-3 rounded-2xl bg-[#12C2A2] text-white text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-30 active:scale-[0.98] transition-all"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 bg-[#F2FAF7] rounded-[2rem] flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} className="text-[#12C2A2]" />
                  </div>
                  <p className="font-bold text-[#151619]">
                    ¿Pagar ${Number(payAmount).toLocaleString()} a {payModal.supplierName}?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmPay(false)}
                      className="flex-1 py-3 rounded-2xl border border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 transition-all"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handlePay}
                      className="flex-1 py-3 rounded-2xl bg-[#12C2A2] text-white text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all"
                    >
                      Sí, Pagar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

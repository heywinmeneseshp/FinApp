'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Plus, CreditCard, Users, 
  Droplets, Home, Zap, Receipt, 
  Trash2, Filter, Calendar, Search,
  CheckCircle2, AlertCircle, Wallet
} from 'lucide-react';
import { useFinanceStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import ConfirmModal from './ConfirmModal';

interface PaymentsModuleProps {
  onBack: () => void;
}

type PaymentTab = 'direct' | 'pending';

export default function PaymentsModule({ onBack }: PaymentsModuleProps) {
  const { 
    movements, 
    accounts, 
    accountsPayable, 
    addMovement, 
    payAccountPayable 
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<PaymentTab>('direct');
  const [isAdding, setIsAdding] = useState(false);

  const [payConfirm, setPayConfirm] = useState<{ isOpen: boolean; billId: string; maxAmount: number }>({ isOpen: false, billId: '', maxAmount: 0 });

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Nómina',
    description: '',
    accountId: accounts[0]?.id || 'default-cash',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    { id: 'Nómina', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'Servicios Públicos', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'Arriendo', icon: Home, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'Suministros', icon: Receipt, color: 'text-zinc-500', bg: 'bg-zinc-50' },
    { id: 'Marketing', icon: TrendingUpIcon, color: 'text-pink-500', bg: 'bg-pink-50' },
    { id: 'Otros Gastos', icon: CreditCard, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  function TrendingUpIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return;

    addMovement({
      type: 'gasto',
      amount: Number(formData.amount),
      category: formData.category,
      description: formData.description || `Pago de ${formData.category}`,
      accountId: formData.accountId,
    });

    setIsAdding(false);
    setFormData({
      amount: '',
      category: 'Nómina',
      description: '',
      accountId: accounts[0]?.id || 'default-cash',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handlePayAccount = (apId: string, amount: number) => {
    const method = accounts.find(a => a.id === formData.accountId)?.type === 'bank' ? 'bank' : 'cash';
    payAccountPayable(apId, amount, method, formData.accountId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const pendingBills = accountsPayable.filter(ap => ap.status !== 'paid');

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm text-zinc-400">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black text-[#151619]">Pagos y Gastos</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/20"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-zinc-100 rounded-2xl">
        <button 
          onClick={() => setActiveTab('direct')}
          className={cn(
            "flex-1 py-3 text-xs font-black rounded-xl transition-all",
            activeTab === 'direct' ? "bg-white text-[#151619] shadow-sm" : "text-zinc-400"
          )}
        >
          GASTOS DIRECTOS
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={cn(
            "flex-1 py-3 text-xs font-black rounded-xl transition-all relative",
            activeTab === 'pending' ? "bg-white text-[#151619] shadow-sm" : "text-zinc-400"
          )}
        >
          PROVEEDORES (CxP)
          {pendingBills.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-zinc-100">
              {pendingBills.length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'direct' ? (
          <motion.div 
            key="direct"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setFormData({ ...formData, category: cat.id });
                    setIsAdding(true);
                  }}
                  className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm flex flex-col items-center gap-2 hover:border-red-200 transition-all text-center"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cat.bg, cat.color)}>
                    <cat.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">{cat.id}</span>
                </button>
              ))}
            </div>

            <div className="pt-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-2 mb-4">Últimos Gastos</h3>
              <div className="space-y-3">
                {movements
                  .filter(m => m.type === 'gasto' && m.category !== 'Compra de Inventario')
                  .slice(-10)
                  .reverse()
                  .map((m) => (
                    <div key={m.id} className="bg-white p-4 rounded-2xl border border-zinc-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#151619]">{m.description}</p>
                          <p className="text-[9px] font-black text-zinc-400 uppercase">{m.category}</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-red-600">-{formatCurrency(m.amount)}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {pendingBills.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h4 className="font-black text-[#151619]">¡Todo al día!</h4>
                  <p className="text-xs text-zinc-400">No tienes cuentas por pagar pendientes.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBills.map((bill) => (
                  <div key={bill.id} className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                          <AlertCircle size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-[#151619]">{bill.supplierName}</h4>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Vence: {new Date(bill.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-zinc-400 mb-1">Pendiente</p>
                        <p className="text-xl font-black text-orange-600">{formatCurrency(bill.amount - bill.paidAmount)}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setPayConfirm({ isOpen: true, billId: bill.id, maxAmount: bill.amount - bill.paidAmount })}
                         className="flex-1 h-12 bg-[#151619] text-white rounded-xl text-xs font-black shadow-lg shadow-zinc-200"
                       >
                         PAGAR AHORA
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 max-h-[92vh] overflow-y-auto"
            >
              <h3 className="text-xl font-black mb-6 text-[#151619]">Registrar Pago</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Valor del Pago</label>
                  <input 
                    required
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="$ 0.00"
                    className="w-full h-16 bg-zinc-50 border-none rounded-2xl px-6 text-2xl font-black placeholder:text-zinc-200 focus:ring-2 focus:ring-red-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Categoría</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold appearance-none"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">¿De qué cuenta?</label>
                    <select 
                      value={formData.accountId}
                      onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                      className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold appearance-none"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Descripción (Opcional)</label>
                  <input 
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ej. Pago internet Mayo"
                    className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 h-14 bg-zinc-100 text-zinc-600 rounded-2xl font-black active:scale-95 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 h-14 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                  >
                    Confirmar Gasto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={payConfirm.isOpen}
        title="Pagar Factura"
        message={`¿Confirmas el pago de $${payConfirm.maxAmount.toLocaleString()}?`}
        variant="info"
        confirmLabel="Pagar Ahora"
        onConfirm={() => {
          handlePayAccount(payConfirm.billId, payConfirm.maxAmount);
          setPayConfirm({ isOpen: false, billId: '', maxAmount: 0 });
        }}
        onCancel={() => setPayConfirm({ isOpen: false, billId: '', maxAmount: 0 })}
      />
    </motion.div>
  );
}

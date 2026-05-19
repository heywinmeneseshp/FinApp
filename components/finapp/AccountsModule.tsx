'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Plus, Wallet, Landmark, 
  Banknote, MoreVertical, Trash2, Edit2, 
  TrendingUp, ArrowDownCircle, Info
} from 'lucide-react';
import { useFinanceStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface AccountsModuleProps {
  onBack: () => void;
}

export default function AccountsModule({ onBack }: AccountsModuleProps) {
  const { accounts, movements, addAccount, updateAccount, deleteAccount } = useFinanceStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash' as 'cash' | 'bank' | 'savings' | 'other',
    initialBalance: 0,
    color: '#12C2A2'
  });

  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;
    
    // Si es la cuenta de caja por defecto, incluye los movimientos que no tienen cuenta asignada (históricos)
    const accountMovements = movements.filter(m => 
      m.accountId === accountId || (accountId === 'default-cash' && !m.accountId)
    );
    
    const balance = accountMovements.reduce((acc, m) => {
      return m.type === 'ingreso' ? acc + m.amount : acc - m.amount;
    }, account.initialBalance);
    
    return balance;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateAccount(editingId, formData);
      setEditingId(null);
    } else {
      addAccount(formData);
    }
    setFormData({ name: '', type: 'cash', initialBalance: 0, color: '#12C2A2' });
    setIsAdding(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm text-zinc-400">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black text-[#151619]">Mis Cuentas</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 bg-[#12C2A2] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#12C2A2]/20"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 text-blue-600 border border-blue-100">
        <Info size={20} className="shrink-0" />
        <p className="text-[10px] font-bold leading-relaxed">
          Crea diferentes cuentas para separar tu dinero físico (Caja) de tus cuentas bancarias o ahorros. 
          Al registrar ventas o gastos, podrás elegir de qué cuenta entra o sale el dinero.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {accounts.map((account) => {
          const balance = getAccountBalance(account.id);
          return (
            <motion.div 
              key={account.id}
              layoutId={account.id}
              className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm relative overflow-hidden group"
            >
              <div 
                className="absolute top-0 left-0 w-2 h-full" 
                style={{ backgroundColor: account.color }}
              />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${account.color}15`, color: account.color }}>
                    {account.type === 'cash' ? <Banknote size={24} /> : <Landmark size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#151619]">{account.name}</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      {account.type === 'cash' ? 'Efectivo / Caja' : 'Cuenta Bancaria'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setFormData({ 
                        name: account.name, 
                        type: account.type, 
                        initialBalance: account.initialBalance,
                        color: account.color || '#12C2A2'
                      });
                      setEditingId(account.id);
                      setIsAdding(true);
                    }}
                    className="p-2 text-zinc-400 hover:text-blue-500 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  {accounts.length > 1 && (
                    <button 
                      onClick={() => {
                        if(confirm('¿Eliminar esta cuenta? Los movimientos asociados quedarán sin cuenta asignada.')) {
                          deleteAccount(account.id);
                        }
                      }}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Saldo Actual</p>
                  <p className="text-2xl font-black text-[#151619]">{formatCurrency(balance)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 rounded-full border border-zinc-100">
                    <TrendingUp size={10} className="text-green-500" />
                    <span className="text-[9px] font-black text-zinc-500">Traceable</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {(isAdding || editingId) && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 max-h-[92vh] overflow-y-auto"
            >
              <h3 className="text-xl font-black mb-6 text-[#151619]">
                {editingId ? 'Editar Cuenta' : 'Nueva Cuenta'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Nombre de la cuenta</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Nequi, Caja, Banco Bogota..."
                    className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-[#12C2A2] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Tipo</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold focus:ring-2 focus:ring-[#12C2A2] transition-all appearance-none"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="bank">Banco</option>
                      <option value="savings">Ahorros</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Saldo Inicial</label>
                    <input 
                      type="number"
                      value={formData.initialBalance}
                      onChange={e => setFormData({ ...formData, initialBalance: Number(e.target.value) })}
                      className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold focus:ring-2 focus:ring-[#12C2A2] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Color Personalizado</label>
                  <div className="flex gap-3 justify-between px-2">
                    {['#12C2A2', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          formData.color === color ? "border-zinc-800 scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setIsAdding(false); setEditingId(null); }}
                    className="flex-1 h-14 bg-zinc-100 text-zinc-600 rounded-2xl font-black active:scale-95 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 h-14 bg-[#12C2A2] text-white rounded-2xl font-black shadow-lg shadow-[#12C2A2]/20 active:scale-95 transition-all"
                  >
                    {editingId ? 'Guardar Cambios' : 'Crear Cuenta'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

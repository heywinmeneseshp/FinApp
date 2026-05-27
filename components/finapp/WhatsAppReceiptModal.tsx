'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageCircle, CheckCircle2, User, Mail, CreditCard, ShieldCheck } from 'lucide-react';
import { useFinanceStore } from '@/lib/store';

interface WhatsAppReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: {
    total: number;
    items: { name: string; quantity: number; price: number }[];
    date: string;
  };
}

export default function WhatsAppReceiptModal({ isOpen, onClose, saleData }: WhatsAppReceiptModalProps) {
  const { customers, upsertCustomer } = useFinanceStore();
  
  const [idNumber, setIdNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [acceptedReceipt, setAcceptedReceipt] = useState(false);
  const [acceptedPromotions, setAcceptedPromotions] = useState(false);

  useEffect(() => {
    if (idNumber.length > 5) {
      const existing = customers.find(c => c.id === idNumber);
      if (existing) {
        queueMicrotask(() => {
          setName(existing.name);
          setEmail(existing.email);
          setPhoneNumber(existing.phone);
          setAcceptedReceipt(existing.acceptedReceipt);
          setAcceptedPromotions(existing.acceptedPromotions);
        });
      }
    }
  }, [idNumber, customers]);

  const handleProcessAndSend = () => {
    if (!phoneNumber || !acceptedReceipt || !idNumber || !name) return;

    upsertCustomer({
      id: idNumber,
      name,
      email,
      phone: phoneNumber,
      acceptedReceipt,
      acceptedPromotions,
      lastUpdated: new Date().toISOString()
    });

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const itemsList = saleData.items
      .map(item => {
        const itemPrice = item.price || 0;
        const itemQuantity = item.quantity || 0;
        return `- ${itemQuantity}x ${item.name} ($${(itemPrice * itemQuantity).toLocaleString()})`;
      })
      .join('\n');

    const messageText = `¡Hola ${name}! ðŸ‘‹ Muchas gracias por tu compra en nuestro negocio. âœ¨\n\n` +
      `ðŸ›ï¸ *Detalle de tu Pedido:*\n` +
      `----------------------------\n` +
      `${itemsList}\n` +
      `----------------------------\n` +
      `ðŸ’° *Total a pagar: $${(saleData.total || 0).toLocaleString()}*\n\n` +
      `ðŸ“… Fecha: ${saleData.date}\n\n` +
      `¡Esperamos verte pronto! ðŸŒ¿âœ¨`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#151619]/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[3rem] p-8 z-10 relative shadow-2xl my-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366]">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Datos del Cliente</h2>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Aceptación y Registro</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-zinc-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessAndSend();
              }}
              className="flex flex-col gap-5"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1">
                  <CreditCard size={12} /> Cédula / NIT
                </label>
                <input 
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Número de identificación"
                  className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-[#12C2A2] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1">
                    <User size={12} /> Nombre
                  </label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre del cliente"
                    className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-[#12C2A2] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1">
                    <Mail size={12} /> Email
                  </label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-[#12C2A2] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1">
                  <MessageCircle size={12} /> WhatsApp (Código + Número)
                </label>
                <input 
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ej: 5491122334455"
                  className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold text-lg focus:ring-2 focus:ring-[#25D366] transition-all"
                />
              </div>

              <div className="bg-zinc-50 p-5 rounded-[2rem] space-y-4 border border-zinc-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={acceptedReceipt}
                    onChange={(e) => setAcceptedReceipt(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded-md border-2 border-zinc-300 transition-all checked:bg-[#12C2A2]"
                  />
                  <span className="text-[11px] font-bold text-zinc-600">
                    Acepto recibir la factura por email o WhatsApp. <span className="text-[#E53030]">(Obligatorio)</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={acceptedPromotions}
                    onChange={(e) => setAcceptedPromotions(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded-md border-2 border-zinc-300 transition-all checked:bg-[#3068E5]"
                  />
                  <span className="text-[11px] font-bold text-zinc-600">
                    Acepto recibir promociones y novedades. <span className="text-zinc-400">(Opcional)</span>
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={onClose} className="flex-1 py-5 bg-zinc-100 text-zinc-500 rounded-3xl font-black text-xs uppercase tracking-widest">
                  Cancelar
                </button>
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!phoneNumber || !acceptedReceipt || !idNumber || !name}
                  className="flex-[2.5] py-5 bg-[#151619] text-white rounded-3xl font-black text-sm flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
                >
                  <Send size={18} />
                  ENVIAR RECIBO
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

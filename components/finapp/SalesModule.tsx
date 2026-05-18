'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Search, ShoppingCart, Trash2, 
  Plus, Minus, History, CheckCircle2, ChevronRight,
  Clock, Package, Tag, User, TrendingUp, ShoppingBag
} from 'lucide-react';
import { useFinanceStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import WhatsAppReceiptModal from './WhatsAppReceiptModal';

interface SalesModuleProps {
  onBack: () => void;
}

export default function SalesModule({ onBack }: SalesModuleProps) {
  const { products, addSale, movements, accounts } = useFinanceStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || 'default-cash');
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatCurrency = (amount: number | undefined | null) => {
    if (!isMounted) return '$0';
    if (amount === undefined || amount === null) return '$0';
    const num = Number(amount);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        const product = products.find(p => p.id === productId);
        if (product && newQty > product.stock && delta > 0) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => {
    const product = products.find(p => p.id === item.productId);
    return acc + (product?.price || 0) * item.quantity;
  }, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const saleItems = cart.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        name: product.name
      };
    });

    const total = cartTotal;
    
    addSale(saleItems, `Venta POS - ${saleItems.length} items`, selectedAccountId);
    
    setLastSaleData({
      total,
      items: saleItems,
      date: new Date().toLocaleString()
    });
    
    setCart([]);
    setShowWhatsAppModal(true);
    setActiveTab('history');
  };

  const history = movements.filter(m => m.category === 'Venta').reverse();

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white min-h-[70vh] rounded-[3rem] shadow-sm overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-6 bg-[#151619] text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} type="button" className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-xl font-bold">Ventas</h2>
        </div>
        <div className="flex bg-zinc-800 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('pos')}
            type="button"
            className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", activeTab === 'pos' ? "bg-[#12C2A2] text-white" : "text-zinc-400")}
          >
            Nueva
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            type="button"
            className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", activeTab === 'history' ? "bg-[#12C2A2] text-white" : "text-zinc-400")}
          >
            Historial
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'pos' ? (
          <>
            <div className="relative">
              <form onSubmit={(e) => e.preventDefault()}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-[#12C2A2]"
                />
              </form>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product.id)}
                  className="bg-zinc-50 p-4 rounded-3xl text-left border border-transparent hover:border-[#12C2A2] transition-all relative group"
                >
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm text-[#12C2A2]">
                    <Package size={24} />
                  </div>
                  <h4 className="font-bold text-[#151619] group-hover:text-[#12C2A2] transition-colors line-clamp-1">{product.name}</h4>
                  <p className="text-lg font-black mt-1">{formatCurrency(product.price)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] bg-zinc-200 px-2 py-1 rounded-lg font-bold text-zinc-500 uppercase">Stock: {product.stock} {product.unit}</span>
                    <Plus size={16} className="text-zinc-300" />
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {history.map(sale => (
              <div key={sale.id} className="bg-zinc-50 p-5 rounded-[2rem] flex items-center justify-between border border-zinc-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#12C2A2] shadow-sm">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#151619]">{formatCurrency(sale.amount)}</h4>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} /> {isMounted ? new Date(sale.date).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-zinc-400 font-bold italic mb-1 uppercase tracking-tighter">Completada</p>
                   <CheckCircle2 size={16} className="text-[#12C2A2] ml-auto" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary (Floating on POS) */}
      <AnimatePresence>
        {activeTab === 'pos' && cart.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="p-6 bg-white border-t border-zinc-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex items-center justify-between gap-6"
          >
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total del Pedido</p>
              <h3 className="text-2xl font-black text-[#151619]">{formatCurrency(cartTotal)}</h3>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              type="button"
              className="bg-[#12C2A2] text-white px-8 py-4 rounded-3xl font-black text-sm relative"
            >
              CARRITO ({cart.length})
              <div className="absolute -top-2 -right-2 bg-white text-[#12C2A2] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-[#12C2A2]">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-[#151619]/60 backdrop-blur-md cursor-pointer"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-xl rounded-t-[3rem] p-6 sm:p-8 space-y-6 relative max-h-[95vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F2FAF7] text-[#12C2A2] rounded-xl flex items-center justify-center">
                    <ShoppingCart size={20} />
                  </div>
                  <h3 className="text-2xl font-black text-[#151619]">Mi Carrito</h3>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  type="button"
                  className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 hover:text-[#151619] transition-colors"
                >
                  <ChevronRight size={20} className="rotate-90" />
                </button>
              </div>

              <div className="space-y-4">
                {cart.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                      <ShoppingBag size={32} />
                    </div>
                    <p className="text-sm font-bold text-zinc-400">Tu carrito está vacío</p>
                  </div>
                ) : (
                  cart.map(item => {
                    const product = products.find(p => p.id === item.productId)!;
                    return (
                      <div key={item.productId} className="flex items-center justify-between bg-zinc-50 p-4 rounded-3xl border border-zinc-100">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#12C2A2] shadow-sm border border-zinc-100">
                            <Package size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-[#151619]">{product.name}</h4>
                            <p className="font-black text-[#12C2A2] text-xs">{formatCurrency(product.price)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center bg-white rounded-2xl border border-zinc-100 p-1 shadow-sm">
                            <button onClick={() => updateQuantity(item.productId, -1)} type="button" className="p-2 text-zinc-400 hover:text-[#E53030] transition-colors">
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} type="button" className="p-2 text-zinc-400 hover:text-[#12C2A2] transition-colors">
                              <Plus size={14} />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(item.productId)} type="button" className="p-2 text-zinc-300 hover:text-[#E53030] transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">¿A qué cuenta entra el dinero?</label>
                  <select 
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold appearance-none text-sm focus:ring-2 focus:ring-[#12C2A2]"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type === 'cash' ? 'Efectivo' : 'Banco'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between items-center px-2">
                  <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Total a pagar</span>
                  <span className="text-2xl font-black text-[#151619]">{formatCurrency(cartTotal)}</span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setTimeout(() => handleCheckout(), 100);
                  }}
                  className="w-full bg-[#151619] text-white py-6 rounded-[2rem] font-black tracking-widest uppercase shadow-xl shadow-[#151619]/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  Confirmar Venta
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {lastSaleData && (
        <WhatsAppReceiptModal 
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          saleData={lastSaleData}
        />
      )}
    </motion.div>
  );
}

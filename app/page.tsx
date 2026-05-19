'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Wallet, ArrowDownCircle, Scale, 
  Package, HeartHandshake, CreditCard, BookOpen,
  LayoutDashboard, ShoppingBag, GraduationCap, Box,
  ChevronRight, User
} from 'lucide-react';
import { useFinanceStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import SalesModule from '@/components/finapp/SalesModule';
import InventoryModule from '@/components/finapp/InventoryModule';
import LearningModule from '@/components/finapp/LearningModule';
import ProfileModule from '@/components/finapp/ProfileModule';
import ReportsModule from '@/components/finapp/ReportsModule';
import AccountsModule from '@/components/finapp/AccountsModule';
import PaymentsModule from '@/components/finapp/PaymentsModule';
import ProfitDetails from '@/components/finapp/ProfitDetails';

export default function Home() {
  const { getTotals, setUser, user } = useFinanceStore();
  const totals = getTotals();
  const [activeView, setActiveView] = useState<'main' | 'sales' | 'inventory' | 'learning' | 'profile' | 'reports' | 'accounts' | 'payments'>('main');
  const [reportType, setReportType] = useState<'ingreso' | 'gasto'>('ingreso');
  const [isProfitDetailsOpen, setIsProfitDetailsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Verificar si ya hay una sesión activa antes de proceder
        const sessionDocRef = doc(db, `users/${firebaseUser.uid}/session`, 'status');
        const docSnap = await getDoc(sessionDocRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Si hay una sesión activa y no es de este mismo dispositivo (opcional: añadir check de timestamp para sesiones muertas)
          if (data.activeSessionId) {
            alert("Ya tienes una sesión activa en otro dispositivo. Por favor cierra esa sesión para poder ingresar aquí.");
            await signOut(auth);
            setUser(null);
            return;
          }
        }

        const newSessionId = Date.now().toString() + Math.random().toString(36).substring(2);
        
        setUser({ 
          uid: firebaseUser.uid, 
          email: firebaseUser.email,
          sessionId: newSessionId
        });

        try {
          await setDoc(sessionDocRef, {
            activeSessionId: newSessionId,
            lastLogin: new Date().toISOString(),
            device: typeof window !== 'undefined' ? navigator.userAgent : 'unknown'
          });

          // Limpiar sesión al cerrar la pestaña/ventana
          const handleUnload = () => {
            setDoc(sessionDocRef, { activeSessionId: null }, { merge: true });
          };
          window.addEventListener('beforeunload', handleUnload);
        } catch (error) {
          console.error("Error setting session:", error);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, [setUser]);

  const formatCurrency = (amount: number | undefined | null) => {
    if (!isMounted) return '$0';
    if (amount === undefined || amount === null) return '$0';
    const num = Number(amount);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString();
  };

  const menuItems = [
    { id: 'sales', name: 'Ventas', icon: ShoppingBag, color: 'bg-[#12C2A2]', textColor: 'text-white' },
    { id: 'inventory', name: 'Inventario', icon: Box, color: 'bg-[#3068E5]', textColor: 'text-white' },
    { id: 'payments', name: 'Pagos', icon: CreditCard, color: 'bg-red-500', textColor: 'text-white' },
    { id: 'accounts', name: 'Cuentas', icon: Wallet, color: 'bg-[#8B5CF6]', textColor: 'text-white' },
    { id: 'learning', name: 'Aprender', icon: GraduationCap, color: 'bg-[#151619]', textColor: 'text-white' },
  ];

  const openReport = (type: 'ingreso' | 'gasto') => {
    setReportType(type);
    setActiveView('reports');
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-24">
      <AnimatePresence>
        {isProfitDetailsOpen && (
          <ProfitDetails isOpen={isProfitDetailsOpen} onClose={() => setIsProfitDetailsOpen(false)} />
        )}
      </AnimatePresence>

      <div className="bg-[#151619] text-white p-8 pb-16 rounded-b-[3rem] shadow-xl">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter">FIN<span className="text-[#12C2A2]">APP</span></h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Profesional</p>
            </div>
            <div className="w-10 h-10 bg-zinc-800 rounded-2xl flex items-center justify-center">
              <LayoutDashboard size={20} className="text-[#12C2A2]" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Saldo Disponible</p>
            <h2 className="text-4xl font-black tracking-tight">{formatCurrency(totals.balance)}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => openReport('ingreso')}
              className="bg-zinc-800/50 p-4 rounded-3xl border border-white/5 text-left transition-all hover:bg-zinc-800"
            >
              <div className="flex items-center gap-2 text-[#12C2A2] mb-1">
                <TrendingUp size={14} />
                <span className="text-[10px] font-black uppercase">Entradas</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(totals.income)}</p>
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => openReport('gasto')}
              className="bg-zinc-800/50 p-4 rounded-3xl border border-white/5 text-left transition-all hover:bg-zinc-800"
            >
              <div className="flex items-center gap-2 text-[#E53030] mb-1">
                <ArrowDownCircle size={14} />
                <span className="text-[10px] font-black uppercase">Salidas</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(totals.expenses)}</p>
            </motion.button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-zinc-800/30 p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                <HeartHandshake size={12} />
                <span className="text-[8px] font-black uppercase tracking-tighter">CxC</span>
              </div>
              <p className="text-sm font-bold truncate">{formatCurrency(totals.totalAR)}</p>
            </div>
            <div className="bg-zinc-800/30 p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-1.5 text-orange-400 mb-1">
                <CreditCard size={12} />
                <span className="text-[8px] font-black uppercase tracking-tighter">CxP</span>
              </div>
              <p className="text-sm font-bold truncate">{formatCurrency(totals.totalAP)}</p>
            </div>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsProfitDetailsOpen(true)}
              className="bg-zinc-800/30 p-3 rounded-2xl border border-white/5 text-left transition-all hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-1.5 text-purple-400 mb-1">
                <Scale size={12} />
                <span className="text-[8px] font-black uppercase tracking-tighter">Utilidad</span>
              </div>
              <p className="text-sm font-bold truncate">{formatCurrency(totals.netProfit)}</p>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 -mt-8 space-y-6">
        {activeView === 'main' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-4"
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-[#12C2A2] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`${item.color} ${item.textColor} w-14 h-14 rounded-3xl flex items-center justify-center shadow-lg`}>
                    <item.icon size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-[#151619]">{item.name}</h3>
                    <p className="text-xs text-zinc-400 font-medium tracking-tight">Gestionar {item.name.toLowerCase()}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-zinc-200 group-hover:text-[#12C2A2]" />
              </button>
            ))}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {activeView === 'sales' && (
            <SalesModule onBack={() => setActiveView('main')} />
          )}
          {activeView === 'inventory' && (
            <InventoryModule onBack={() => setActiveView('main')} />
          )}
          {activeView === 'learning' && (
            <LearningModule onBack={() => setActiveView('main')} />
          )}
          {activeView === 'profile' && (
            <ProfileModule onBack={() => setActiveView('main')} />
          )}
          {activeView === 'reports' && (
            <ReportsModule initialType={reportType} onBack={() => setActiveView('main')} />
          )}
          {activeView === 'accounts' && (
            <AccountsModule onBack={() => setActiveView('main')} />
          )}
          {activeView === 'payments' && (
            <PaymentsModule onBack={() => setActiveView('main')} />
          )}
        </AnimatePresence>
      </div>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#151619] text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-12 z-50">
        <button onClick={() => setActiveView('main')} className={activeView === 'main' ? 'text-[#12C2A2]' : 'text-zinc-500'}>
          <LayoutDashboard size={24} />
        </button>
        <button onClick={() => setActiveView('sales')} className={activeView === 'sales' ? 'text-[#12C2A2]' : 'text-zinc-500'}>
          <ShoppingBag size={24} />
        </button>
        <button onClick={() => setActiveView('inventory')} className={activeView === 'inventory' ? 'text-[#12C2A2]' : 'text-zinc-500'}>
          <Box size={24} />
        </button>
        <button onClick={() => setActiveView('profile')} className={activeView === 'profile' ? 'text-[#12C2A2]' : 'text-zinc-500'}>
          <User size={24} />
        </button>
      </nav>
    </main>
  );
}

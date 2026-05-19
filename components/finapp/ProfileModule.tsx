'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Cloud, CloudOff, RefreshCw, LogIn, LogOut, 
  Check, AlertCircle, ShoppingBag, Box, TrendingUp,
  Settings, Shield, HelpCircle, ChevronRight, ArrowLeft
} from 'lucide-react';
import { useFinanceStore } from '@/lib/store';
import { auth, signInWithGoogle, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface ProfileModuleProps {
  onBack: () => void;
}

export default function ProfileModule({ onBack }: ProfileModuleProps) {
  const { user, setUser, syncLocalToCloud, syncCloudToLocal, getTotals, hasUnsavedChanges } = useFinanceStore();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const totals = getTotals();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setStatus('idle');
      setMessage('');
      await signInWithGoogle();
      // user will be set by the listener in Home
      setStatus('success');
      setMessage('Conexión solicitada. Verifica si se abrió una ventana emergente.');
    } catch (error: any) {
      console.error('Auth error:', error);
      setStatus('error');
      if (error.code === 'auth/popup-blocked') {
        setMessage('El navegador bloqueó la ventana. Por favor permítela.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setMessage('Se canceló la solicitud de conexión.');
      } else {
        setMessage(error.message || 'Error al conectar con Google');
      }
    } finally {
      setLoading(false);
      setTimeout(() => setStatus('idle'), 6000);
    }
  };

  const handleSignOut = async () => {
    if (user && hasUnsavedChanges) {
      const confirmSignOut = window.confirm(
        "Tienes cambios sin sincronizar. Si cierras la sesión ahora, los cambios locales podrían perderse si accedes desde otro dispositivo. ¿Deseas cerrar la sesión de todos modos?"
      );
      if (!confirmSignOut) return;
    }

    try {
      setLoading(true);
      if (user?.uid) {
        // Limpiar sesión en Firestore antes de salir
        const sessionDocRef = doc(db, `users/${user.uid}/session`, 'status');
        await setDoc(sessionDocRef, { activeSessionId: null }, { merge: true });
      }
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncUp = async () => {
    try {
      setLoading(true);
      await syncLocalToCloud();
      setStatus('success');
      setMessage('Sincronizado a la nube');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Error al subir datos');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleSyncDown = async () => {
    try {
      setLoading(true);
      await syncCloudToLocal();
      setStatus('success');
      setMessage('Datos restaurados');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Error al recuperar datos');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const menuItems = [
    { icon: Shield, label: 'Seguridad y Privacidad', color: 'text-zinc-400' },
    { icon: HelpCircle, label: 'Centro de Ayuda', color: 'text-zinc-400' },
    { icon: Settings, label: 'Configuración Avanzada', color: 'text-zinc-400' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pb-12"
    >
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-[#12C2A2] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-2xl font-black text-[#151619]">Mi Perfil</h2>
      </div>

      {/* Perfil Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm text-center space-y-4">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-zinc-100 rounded-[2rem] flex items-center justify-center text-zinc-300 mx-auto border-4 border-white shadow-xl">
            <User size={48} />
          </div>
          <div className={cn(
            "absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center",
            user ? "bg-[#12C2A2]" : "bg-zinc-300"
          )}>
            {user ? <Cloud size={14} className="text-white" /> : <CloudOff size={14} className="text-white" />}
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-black text-[#151619]">{user ? user.email?.split('@')[0] : 'Emprendedor'}</h3>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
            {user ? user.email : 'Modo fuera de línea'}
          </p>
        </div>

        {user ? (
          <button 
            onClick={handleSignOut}
            className="text-zinc-400 hover:text-[#E53030] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mx-auto transition-colors"
          >
            <LogOut size={12} />
            Cerrar Sesión
          </button>
        ) : (
          <button 
            onClick={handleSignIn}
            disabled={loading}
            className="bg-[#151619] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 mx-auto shadow-xl shadow-zinc-200 active:scale-95 transition-all"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <LogIn size={14} />}
            Conectar Google Account
          </button>
        )}
      </div>

      {/* Cloud Sync Section */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F2FAF7] text-[#12C2A2] rounded-xl flex items-center justify-center">
            <Cloud size={20} />
          </div>
          <div>
            <h4 className="font-bold text-[#151619]">Sincronización en la Nube</h4>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Gestiona tus respaldos</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {status !== 'idle' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold",
                status === 'success' ? "bg-[#F2FAF7] text-[#12C2A2]" : "bg-[#FFF2F2] text-[#E53030]"
              )}
            >
              {status === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3">
          <button
            disabled={!user || loading}
            onClick={handleSyncUp}
            className={cn(
              "p-4 rounded-2xl flex flex-col gap-2 items-start transition-all border",
              user 
                ? (hasUnsavedChanges ? "bg-amber-50 border-amber-200 shadow-sm active:scale-95" : "bg-white border-zinc-100 hover:border-[#12C2A2] shadow-sm active:scale-95")
                : "bg-zinc-50 border-transparent opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center relative", 
              user ? (hasUnsavedChanges ? "bg-amber-100 text-amber-600" : "bg-[#F2FAF7] text-[#12C2A2]") : "bg-zinc-200 text-zinc-400"
            )}>
              <Cloud size={16} />
              {hasUnsavedChanges && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-[#151619]">Subir Info</p>
              <p className={cn("text-[8px] font-bold leading-tight", hasUnsavedChanges ? "text-amber-600" : "text-zinc-400")}>
                {hasUnsavedChanges ? "¡Cargar cambios!" : "Guardar progreso"}
              </p>
            </div>
          </button>

          <button
            disabled={!user || loading}
            onClick={handleSyncDown}
            className={cn(
              "p-4 rounded-2xl flex flex-col gap-2 items-start transition-all border",
              user 
                ? "bg-white border-zinc-100 hover:border-[#3068E5] shadow-sm active:scale-95" 
                : "bg-zinc-50 border-transparent opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", user ? "bg-[#F2F5FA] text-[#3068E5]" : "bg-zinc-200 text-zinc-400")}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-[#151619]">Recuperar</p>
              <p className="text-[8px] font-bold text-zinc-400 leading-tight">Bajar datos de la nube</p>
            </div>
          </button>
        </div>
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm text-center">
          <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">Ventas</p>
          <p className="text-sm font-black text-[#151619]">{(totals.sales || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm text-center">
          <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">Items</p>
          <p className="text-sm font-black text-[#151619]">12</p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm text-center">
          <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">Lecciones</p>
          <p className="text-sm font-black text-[#151619]">4/8</p>
        </div>
      </div>

      {/* Menu Options */}
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
        {menuItems.map((item, i) => (
          <button 
            key={i}
            className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0"
          >
            <div className="flex items-center gap-4">
              <item.icon size={20} className={item.color} />
              <span className="text-sm font-bold text-[#151619]">{item.label}</span>
            </div>
            <ChevronRight size={18} className="text-zinc-300" />
          </button>
        ))}
      </div>

      <div className="text-center pt-4">
        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">FinApp Profesional v1.0.4</p>
      </div>
    </motion.div>
  );
}

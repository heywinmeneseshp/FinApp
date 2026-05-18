'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/finapp/DashboardHeader';
import MetricCard from '@/components/finapp/MetricCard';
import IncomeExpenseChart from '@/components/finapp/IncomeExpenseChart';
import InfoBlock from '@/components/finapp/InfoBlock';
import QuickActions from '@/components/finapp/QuickActions';
import BottomNav from '@/components/finapp/BottomNav';
import LearningModule from '@/components/finapp/LearningModule';
import { useFinanceStore } from '@/lib/store';
import { TrendingUp, Wallet, ArrowDownCircle, Scale, Package, HeartHandshake, CreditCard, BookOpen } from 'lucide-react';

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<'home' | 'learning'>('home');
  const { getTotals, products } = useFinanceStore();
  const totals = getTotals();

  if (currentView === 'learning') {
    return (
      <>
        <LearningModule onBack={() => setCurrentView('home')} />
        <BottomNav activeTab="Aprender" onChange={(tab) => {
          if (tab === 'Inicio') setCurrentView('home');
        }} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#151619] font-sans pb-32">
      <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <DashboardHeader />

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard 
            title="Ventas del mes"
            value={`$${totals.sales.toLocaleString()}`}
            change="Acumulado"
            trend="up"
            variant="green"
            icon={<TrendingUp size={22} />}
          />
          <MetricCard 
            title="Ingresos"
            value={`$${totals.income.toLocaleString()}`}
            change="Total"
            trend="up"
            variant="blue"
            icon={<Wallet size={22} />}
          />
          <MetricCard 
            title="Gastos"
            value={`$${totals.expenses.toLocaleString()}`}
            change="Total"
            trend="down"
            variant="red"
            icon={<ArrowDownCircle size={22} />}
          />
          <MetricCard 
            title="Balance"
            value={`$${totals.balance.toLocaleString()}`}
            change={totals.balance >= 0 ? "Positivo" : "Negativo"}
            trend={totals.balance >= 0 ? "up" : "down"}
            variant="purple"
            icon={<Scale size={22} />}
          />
        </div>

        {/* Charts Section */}
        <IncomeExpenseChart />

        {/* Dynamic Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoBlock 
            title="Inventario"
            value={products.reduce((acc, p) => acc + p.stock, 0).toString()}
            subtitle={`${products.length} productos diferentes`}
            statusText="Saludable"
            statusVariant="green"
            icon={<Package size={24} className="text-green-600" />}
            iconBg="bg-green-50"
            alert={products.some(p => p.stock < 10) ? { text: `${products.filter(p => p.stock < 10).length} productos bajos` } : undefined}
          />
          <InfoBlock 
            title="Cuentas por cobrar"
            value="$8,450"
            subtitle="5 facturas pendientes"
            icon={<HeartHandshake size={24} className="text-amber-600" />}
            iconBg="bg-amber-50"
          />
          <InfoBlock 
            title="Cuentas por pagar"
            value="$5,230"
            subtitle="3 facturas pendientes"
            icon={<CreditCard size={24} className="text-purple-600" />}
            iconBg="bg-purple-50"
          />
          <div onClick={() => setCurrentView('learning')} className="cursor-pointer">
            <InfoBlock 
              title="Aprende contabilidad"
              value="Contabilidad"
              subtitle=""
              icon={<BookOpen size={24} className="text-blue-600" />}
              iconBg="bg-blue-50"
              progress={{
                value: 60,
                currentLesson: "Estados Financieros"
              }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.textContent?.includes('Aprender')) setCurrentView('learning');
        }}>
          <QuickActions />
        </div>

      </div>

      {/* Navigation */}
      <BottomNav activeTab="Inicio" onChange={(tab) => {
        if (tab === 'Aprender') setCurrentView('learning');
        if (tab === 'Inicio') setCurrentView('home');
      }} />
    </div>
  );
}

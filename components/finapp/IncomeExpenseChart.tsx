'use client';

import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useFinanceStore } from '@/lib/store';
function buildChartData(movements: { type: string; amount: number; date: string }[]) {
  const days: Record<string, { ingresos: number; gastos: number }> = {};
  
  movements.forEach(m => {
    const day = new Date(m.date).toISOString().slice(0, 10);
    if (!days[day]) days[day] = { ingresos: 0, gastos: 0 };
    if (m.type === 'ingreso') days[day].ingresos += m.amount;
    else days[day].gastos += m.amount;
  });

  const sorted = Object.entries(days).sort(([a], [b]) => a.localeCompare(b));
  
  return sorted.map(([date, values]) => ({
    name: new Date(date).getDate().toString(),
    ingresos: Math.round(values.ingresos),
    gastos: Math.round(values.gastos),
  }));
}

export default function IncomeExpenseChart() {
  const { movements, getTotals } = useFinanceStore();
  const totals = getTotals();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = React.useMemo(() => buildChartData(movements), [movements]);

  const formatCurrency = (amount: number | undefined | null) => {
    if (!isMounted) return '$0';
    if (amount === undefined || amount === null) return '$0';
    const num = Number(amount);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString();
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#151619]">Entradas vs. Salidas</h3>
        <div className="flex items-center gap-1 px-3 py-1.5 bg-zinc-50 rounded-xl border border-zinc-100 cursor-pointer hover:bg-zinc-100 transition-colors">
          <span className="text-xs font-medium text-zinc-600">Este mes</span>
          <ChevronDown size={14} className="text-zinc-400" />
        </div>
      </div>

      <div className="flex gap-6 items-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded-full bg-[#12C2A2]"></div>
          <span className="text-xs font-medium text-zinc-500">Entradas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded-full bg-[#E53030]"></div>
          <span className="text-xs font-medium text-zinc-500">Salidas</span>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData.length > 0 ? chartData : [{ name: 'Sin datos', ingresos: 0, gastos: 0 }]}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#12C2A2" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#12C2A2" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E53030" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#E53030" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#A0A0A0' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#A0A0A0' }}
              tickFormatter={(value) => `$${value/1000}k`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            />
            <Area 
              type="monotone" 
              dataKey="ingresos" 
              stroke="#12C2A2" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorIngresos)" 
            />
            <Area 
              type="monotone" 
              dataKey="gastos" 
              stroke="#E53030" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorGastos)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-[#12C2A2] text-white rounded-md font-bold">{formatCurrency(totals.income)}</span>
          </div>
          <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-[#E53030] text-white rounded-md font-bold">{formatCurrency(totals.expenses)}</span>
          </div>
      </div>
    </div>
  );
}

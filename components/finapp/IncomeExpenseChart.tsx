'use client';

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { ChevronDown } from 'lucide-react';

const data = [
  { name: '1', ingresos: 12000, gastos: 10000 },
  { name: '8', ingresos: 21000, gastos: 12000 },
  { name: '15', ingresos: 23000, gastos: 14000 },
  { name: '22', ingresos: 32000, gastos: 16000 },
  { name: '30', ingresos: 38000, gastos: 14000 },
];

import { useFinanceStore } from '@/lib/store';

export default function IncomeExpenseChart() {
  const { getTotals } = useFinanceStore();
  const totals = getTotals();
  const [isMounted, setIsMounted] = React.useState(false);

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
          <AreaChart data={data}>
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

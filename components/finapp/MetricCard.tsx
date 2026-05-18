'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  variant: 'green' | 'blue' | 'red' | 'purple';
}

const variants = {
  green: {
    bg: 'bg-[#F2FAF7]',
    iconBg: 'bg-[#E3F5EE]',
    iconColor: 'text-[#12C2A2]',
    trendColor: 'text-[#12C2A2]'
  },
  blue: {
    bg: 'bg-[#F2F7FF]',
    iconBg: 'bg-[#E5EFFF]',
    iconColor: 'text-[#3068E5]',
    trendColor: 'text-[#3068E5]'
  },
  red: {
    bg: 'bg-[#FFF2F2]',
    iconBg: 'bg-[#FFE5E5]',
    iconColor: 'text-[#E53030]',
    trendColor: 'text-[#E53030]'
  },
  purple: {
    bg: 'bg-[#F7F2FF]',
    iconBg: 'bg-[#EEE5FF]',
    iconColor: 'text-[#7C30E5]',
    trendColor: 'text-[#7C30E5]'
  }
};

export default function MetricCard({ title, value, change, trend, icon, variant }: MetricCardProps) {
  const styles = variants[variant];

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={cn(
        "p-5 rounded-3xl flex flex-col gap-4 shadow-sm border border-white/50",
        styles.bg
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center",
        styles.iconBg
      )}>
        <span className={styles.iconColor}>{icon}</span>
      </div>
      
      <div className="flex flex-col gap-1">
        <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{title}</p>
        <h3 className="text-xl font-bold text-[#151619]">{value}</h3>
      </div>

      <div className="flex items-center gap-1">
        {trend === 'up' ? (
          <ArrowUpRight size={14} className={styles.trendColor} />
        ) : (
          <ArrowDownRight size={14} className={styles.trendColor} />
        )}
        <span className={cn("text-[10px] font-bold", styles.trendColor)}>
          {change} <span className="text-zinc-400 font-normal">vs. mes anterior</span>
        </span>
      </div>
    </motion.div>
  );
}

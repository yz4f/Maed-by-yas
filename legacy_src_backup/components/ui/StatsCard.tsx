import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color?: 'red' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple' | 'sky' | 'cyan';
  trend?: { value: number; isUp: boolean };
  subtitle?: string;
}

const colorMap = {
  red: 'bg-[#181A20] text-white border-white/[0.08] hover:border-red-900/50 shadow-lg shadow-black/40',
  emerald: 'bg-[#181A20] text-white border-white/[0.08] hover:border-emerald-900/50 shadow-lg shadow-black/40',
  amber: 'bg-[#181A20] text-white border-white/[0.08] hover:border-amber-900/50 shadow-lg shadow-black/40',
  rose: 'bg-[#181A20] text-white border-white/[0.08] hover:border-rose-900/50 shadow-lg shadow-black/40',
  purple: 'bg-[#181A20] text-white border-white/[0.08] hover:border-purple-900/50 shadow-lg shadow-black/40',
  indigo: 'bg-[#181A20] text-white border-white/[0.08] hover:border-indigo-900/50 shadow-lg shadow-black/40',
  sky: 'bg-[#181A20] text-white border-white/[0.08] hover:border-red-900/50 shadow-lg shadow-black/40',
  cyan: 'bg-[#181A20] text-white border-white/[0.08] hover:border-cyan-900/50 shadow-lg shadow-black/40',
};

const iconBgMap = {
  red: 'bg-red-950/60 text-red-500 border border-red-900/40',
  emerald: 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40',
  amber: 'bg-amber-950/60 text-amber-400 border border-amber-900/40',
  rose: 'bg-rose-950/60 text-rose-400 border border-rose-900/40',
  purple: 'bg-purple-950/60 text-purple-400 border border-purple-900/40',
  indigo: 'bg-indigo-950/60 text-indigo-400 border border-indigo-900/40',
  sky: 'bg-red-950/60 text-red-400 border border-red-900/40',
  cyan: 'bg-cyan-950/60 text-cyan-400 border border-cyan-900/40',
};

export function StatsCard({ title, value, icon, color = 'red', trend, subtitle }: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 800;
    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(Math.floor(easeProgress * (end - start) + start));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const cardStyle = colorMap[color] || colorMap.red;
  const iconStyle = iconBgMap[color] || iconBgMap.red;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass-card p-5 rounded-2xl relative overflow-hidden transition-all duration-200 ${cardStyle}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-gray-400 block">{title}</span>
          <div className="text-2xl sm:text-3xl font-black text-white font-alexandria tracking-tight">
            {displayValue.toLocaleString()}
          </div>
        </div>

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${iconStyle}`}>
          {icon}
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
          {trend && (
            <span className={`flex items-center gap-1 font-bold ${trend.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{trend.isUp ? '+' : '-'}{trend.value}% مقارنة بالشهر السابق</span>
            </span>
          )}
          {subtitle && !trend && (
            <span className="text-gray-500 font-medium">{subtitle}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

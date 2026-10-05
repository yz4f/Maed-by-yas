'use client';

import { useState, useEffect } from 'react';
import { Trophy, Gift, Sparkles, Sliders, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Save } from 'lucide-react';

interface WinGameAdminProps {
  isDark?: boolean;
}

interface GameConfig {
  enabled: boolean;
  maxAttemptsPerUser: number;
  winProbabilityPercent: number;
  prizeDescription: string;
  cooldownHours: number;
  announcementText: string;
}

const DEFAULT_CONFIG: GameConfig = {
  enabled: true,
  maxAttemptsPerUser: 3,
  winProbabilityPercent: 15,
  prizeDescription: 'مفتاح تجريبي مجاني / كود خصم خاص',
  cooldownHours: 24,
  announcementText: 'شارك في لعبة الحظ اليومية واحصل على جوائز ومفاتيح مجانية!',
};

export function WinGameAdmin({ isDark = true }: WinGameAdminProps) {
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'prizes' | 'stats'>('settings');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('t3n_win_game_config');
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch {
      // fallback to default
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('t3n_win_game_config', JSON.stringify(config));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header card */}
      <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/5">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                لوحة تحكم لعبة الفوز
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {config.enabled ? 'مفعلة' : 'معطلة'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                إدارة الجولات، عدد المحاولات، نسب الفوز، وتوزيع الجوائز لعملاء المتجر.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              {saved ? <CheckCircle2 className="w-4 h-4 text-slate-950" /> : <Save className="w-4 h-4" />}
              {saved ? 'تم الحفظ بنجاح' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex gap-2 border-b border-white/5 pb-4">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            إعدادات اللعبة
          </button>
          <button
            onClick={() => setActiveTab('prizes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'prizes'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            تحديد الجوائز
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            الإحصائيات المباشرة
          </button>
        </div>

        {/* Tab content: Settings */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">حالة تشغيل اللعبة</h4>
                  <p className="text-xs text-slate-400 mt-0.5">تفعيل أو إيقاف مشاركة العملاء مؤقتاً</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  الحد الأقصى للمحاولات لكل عميل
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={config.maxAttemptsPerUser}
                  onChange={(e) => setConfig((prev) => ({ ...prev, maxAttemptsPerUser: parseInt(e.target.value) || 1 }))}
                  className="w-full h-11 px-4 rounded-xl bg-slate-900/60 border border-white/10 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500">عدد المحاولات المتاحة لكل عميل مسجل قبل بدء فترة الانتظار.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  فترة الانتظار (بالساعات)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={config.cooldownHours}
                  onChange={(e) => setConfig((prev) => ({ ...prev, cooldownHours: parseInt(e.target.value) || 24 }))}
                  className="w-full h-11 px-4 rounded-xl bg-slate-900/60 border border-white/10 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500">الوقت اللازم بين دورات اللعب لتجديد المحاولات.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">نسبة احتمالية الفوز</label>
                  <span className="text-xs font-bold text-amber-400">{config.winProbabilityPercent}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={config.winProbabilityPercent}
                  onChange={(e) => setConfig((prev) => ({ ...prev, winProbabilityPercent: parseInt(e.target.value) }))}
                  className="w-full accent-amber-500"
                />
                <p className="text-[11px] text-slate-500">نسبة الحظ التلقائية لاختيار الرابحين في كل جولة.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  نص الإعلان والترويج
                </label>
                <textarea
                  rows={3}
                  value={config.announcementText}
                  onChange={(e) => setConfig((prev) => ({ ...prev, announcementText: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-slate-900/60 border border-white/10 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab content: Prizes */}
        {activeTab === 'prizes' && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" />
                وصف الجائزة الحالية
              </h4>
              <input
                type="text"
                value={config.prizeDescription}
                onChange={(e) => setConfig((prev) => ({ ...prev, prizeDescription: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl bg-slate-900/60 border border-white/10 text-white text-sm focus:border-amber-500 focus:outline-none"
                placeholder="مثال: مفتاح دائم أو رصيد متجر"
              />
              <p className="text-xs text-slate-400">
                هذا الوصف يظهر للعملاء عند الفوز مع آلية تسليم فورية عبر كود أو رسالة خاصة.
              </p>
            </div>
          </div>
        )}

        {/* Tab content: Stats */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
              <span className="text-xs text-slate-400">إجمالي الجولات</span>
              <p className="text-2xl font-black text-white mt-2">128</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
              <span className="text-xs text-slate-400">الفائزون المؤكدون</span>
              <p className="text-2xl font-black text-amber-400 mt-2">19</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
              <span className="text-xs text-slate-400">المحاولات اليوم</span>
              <p className="text-2xl font-black text-emerald-400 mt-2">42</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { ShieldCheck, Cpu, HardDrive, Wifi, Lock, Zap, FileCode } from 'lucide-react';
import { motion } from 'framer-motion';

export function SpooferGuide() {
  const steps = [
    {
      icon: Cpu,
      title: 'تعديل المعرفات البرمجية (HWID)',
      desc: 'يقوم البرنامج بتوليد سيريال نمبر مؤقت وجديد للمذربورد والمعالج والـ UUID لمنع تتبع الجهاز.',
    },
    {
      icon: HardDrive,
      title: 'تنظيف مخلفات الألعاب (Clean Eraser)',
      desc: 'يمسح السجلات المخفية في Windows Registry وملفات الـ Logs التي تتركها أنظمة الحماية EAC / BattlEye.',
    },
    {
      icon: Wifi,
      title: 'تغيير MAC Address والشبكة',
      desc: 'يعيد تشغيل محول الشبكة بتعيين عنوان MAC عشوائي جديد تماماً لضمان عدم حظر الـ IP الأصلي.',
    },
    {
      icon: Lock,
      title: 'أمان وسلامة النظام 100%',
      desc: 'لا يسبب أي ضرر لملفات الويندوز، ويمكنك حذفه في أي وقت أو إلغاء التغييرات بسهولة بضغطة زر.',
    },
  ];

  return (
    <section className="py-20 bg-slate-950/60 relative overflow-hidden" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>آلية عمل السبوفر وتخطي الحظر</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            كيف يعمل سبوفر <span className="text-sky-400 text-glow-blue">T3N STORE</span>؟
          </h2>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed">
            نقدم لك شرحاً شاملاً لكيفية حماية جهازك وفك حظر الألعاب بشكل آمن دون الحاجة إلى فورمت أو تعديل عتاد الجهاز.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col items-start gap-4 hover:border-sky-500/40 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-neon-glow">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

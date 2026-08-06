'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FAQSection() {
  const faqs = [
    {
      q: 'كيف يمكنني تفعيل المفتاح والحصول على المنتج؟',
      a: 'بعد الحصول على المفتاح (مثل T3N-XXXXX-XXXXX)، اضغط على زر "تفعيل المفتاح" أعلى الصفحة، سجل دخولك بحساب ديسكورد، أدخل المفتاح واضغط تفعيل. سيتم إضافة المنتج ورتب الديسكورد لحسابك فوراً.',
    },
    {
      q: 'هل يتطلب السبوفر إعادة فرمتة الجهاز (Format)؟',
      a: 'لا، معظم منتجات متجر تـعـن لا تتطلب فرمتة الجهاز إطلاقاً. يعمل السبوفر بنقرة واحدة ويغير المعرفات تلقائياً.',
    },
    {
      q: 'ماذا يحدث إذا تم إزالة أو إيقاف المنتج من الإدارة؟',
      a: 'في حال تم إيقاف أو حذف المنتج من قبل الإدارة، تفقد صلاحية تحميل الملفات ويتم إزالة رتبة الديسكورد المرتبطة فوراً عبر البوت الآلي.',
    },
    {
      q: 'كيف يمكنني الحصول على الدعم الفني؟',
      a: 'يمكنك الانضمام مباشرة إلى سيرفر الديسكورد الرسمي، وفتح تذكرة دعم فنّي (Ticket) وسيقوم الفريق بمساعدتك 24/7.',
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-20 relative" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-sky-400 font-bold text-xs uppercase mb-2">
            <HelpCircle className="w-4 h-4" />
            <span>الأسئلة الشائعة</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">إجابات عن معظم استفساراتك</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="glass-panel border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 flex items-center justify-between text-right text-base font-bold text-slate-100 hover:text-sky-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-sky-400 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

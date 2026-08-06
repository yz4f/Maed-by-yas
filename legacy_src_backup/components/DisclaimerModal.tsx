import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle, Shield, ShieldAlert, Info } from 'lucide-react';

interface DisclaimerModalProps {
  onAccept: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
  // Animation variants for card staggering
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
        when: 'beforeChildren',
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' },
    },
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/95 backdrop-blur-xl" dir="rtl">
      
      {/* Dynamic Animated Ambient Glows */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.45, 0.3]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[130px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1.1, 1, 1.1],
          opacity: [0.25, 0.38, 0.25]
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" 
      />

      {/* Main Modal Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-2xl bg-[#080b11]/90 border border-gray-800/80 rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-md"
      >
        
        {/* Top Animated Premium Accent Line */}
        <div className="h-[3px] w-full bg-gradient-to-l from-sky-400 via-blue-500 to-indigo-500 relative overflow-hidden">
          <motion.div
            animate={{ x: ['100%', '-100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </div>

        {/* Header Section */}
        <div className="px-8 pt-8 pb-5 text-center">
          <div className="relative mx-auto w-20 h-20 mb-4.5">
            {/* Glowing ring animation */}
            <motion.div 
              animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-sky-500/15 rounded-2xl blur-xl" 
            />
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-gray-900 to-sky-950 border border-sky-500/30 flex items-center justify-center">
              <ShieldAlert className="w-9 h-9 text-sky-400" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">إخلاء مسؤولية</h2>
          <p className="text-xs text-sky-400/80 font-extrabold tracking-wider mt-1.5">
            يرجى قراءة الشروط والموافقة عليها للمتابعة إلى الحساب
          </p>
        </div>

        {/* Info Cards List */}
        <div className="px-8 pb-5 space-y-3.5">
          
          {/* Card 1: Device Responsibility */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.015, borderColor: 'rgba(56, 189, 248, 0.35)', backgroundColor: 'rgba(10, 15, 26, 0.7)' }}
            className="flex gap-4.5 p-5 rounded-2xl bg-[#0c101b]/60 border border-gray-800/70 transition-all duration-200 text-right group"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-500/20 transition-colors">
              <AlertTriangle className="w-5.5 h-5.5 text-amber-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-black text-white tracking-wider uppercase">— مسؤولية الجهاز</h3>
              <p className="text-[12.5px] text-gray-400 leading-[1.7]">
                في حال كان لديك مشكلة بجهازك أو فاجأتك مشكلة في جهازك وقت استعمال منتجاتنا الخاصة، <span className="text-amber-400/90 font-bold">ليس لنا أي علاقة أو إشكالية بنظام جهازك أو مشاكل جهازك.</span>
              </p>
            </div>
          </motion.div>

          {/* Card 2: Complaints Policy */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.015, borderColor: 'rgba(56, 189, 248, 0.35)', backgroundColor: 'rgba(10, 15, 26, 0.7)' }}
            className="flex gap-4.5 p-5 rounded-2xl bg-[#0c101b]/60 border border-gray-800/70 transition-all duration-200 text-right group"
          >
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-sky-500/20 transition-colors">
              <Info className="w-5.5 h-5.5 text-sky-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-black text-white tracking-wider uppercase">— سياسة الشكاوى</h3>
              <p className="text-[12.5px] text-gray-400 leading-[1.7]">
                تـعـن عبارة عن منصة يتم تقديم طلباتك فيها مع شرح كامل وواضح. وفي حال تم تقديم شكوى بسبب هكذا مشكلة، لن يتم الرد عليك وتكون المسؤولية كاملة عليك.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Support Guarantee */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.015, borderColor: 'rgba(56, 189, 248, 0.35)', backgroundColor: 'rgba(10, 15, 26, 0.7)' }}
            className="flex gap-4.5 p-5 rounded-2xl bg-[#0c101b]/60 border border-gray-800/70 transition-all duration-200 text-right group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-500/20 transition-colors">
              <Shield className="w-5.5 h-5.5 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-black text-white tracking-wider uppercase">— ضمان المنتجات</h3>
              <p className="text-[12.5px] text-gray-400 leading-[1.7]">
                نقدر ثقتكم بنا، لكننا حرصاً منا نقدم لكم هذا التنويه لكل شيء، مع العلم أن <span className="text-emerald-400/90 font-bold">جميع منتجاتنا مضمونة بتحديثات يومية مستمرة.</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Accept Button Section */}
        <motion.div 
          variants={itemVariants}
          className="px-8 pb-8 pt-1.5"
        >
          <motion.button
            onClick={onAccept}
            whileHover={{ scale: 1.018, boxShadow: '0 0 25px rgba(14, 165, 233, 0.35)' }}
            whileTap={{ scale: 0.985 }}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-sky-500/10 transition-all text-sm cursor-pointer border border-sky-400/20"
          >
            <CheckCircle className="w-5 h-5" />
            <span>موافق والمتابعة</span>
          </motion.button>
        </motion.div>

      </motion.div>
    </div>
  );
};

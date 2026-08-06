import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Search, ChevronLeft, Shield, Zap, Cpu,
  CheckCircle2, Terminal, Copy, Check, Wrench, Lock, Flame
} from 'lucide-react';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Button } from '../components/ui/Button.tsx';

interface DocSection {
  id: string;
  title: string;
  category?: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const DocsPage: React.FC = () => {
  const [activeDocId, setActiveDocId] = useState<string>('welcome');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const docSections: DocSection[] = [
    {
      id: 'welcome',
      title: 'مرحباً بك في تعن | T3N',
      category: 'عام',
      icon: <Flame className="w-4 h-4 text-sky-500" />,
      content: (
        <div className="space-y-8">
          <Card variant="gradient" className="bg-gradient-to-l from-sky-500/5 via-[#0D1829] to-[#0D1829] border border-sky-900/20 shadow-none relative overflow-hidden text-center py-10 px-6 sm:px-12 flex flex-col items-center justify-center min-h-[280px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sky-500/10 rounded-full blur-[60px] pointer-events-none" />
            <Badge variant="info" className="mb-6 relative z-10 scale-110 bg-sky-500/10 text-sky-400 border-sky-500/20">التوثيق الرسمي v2.0</Badge>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 font-alexandria tracking-wide relative z-10 leading-tight">
              مركز توثيق خدمات T3N | تعن
            </h1>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-2xl relative z-10 font-medium">
              أهلاً بك في الدليل الرسمي الشامل. اتبع الخطوات الموضحة بالترتيب لضمان الحصول على أداء مستقر ومحمي 100%.
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="glass" className="hover:border-sky-500/45 transition-all group cursor-default p-6 bg-[#0D1829] border border-sky-900/20 shadow-none">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4 text-sky-400 group-hover:scale-110 group-hover:bg-sky-500/20 transition-all shadow-inner">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2 font-alexandria tracking-wide">حماية تلقائية متقدمة</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                تغيير الهوية العتادية الكاملة للوحة الأم (Motherboard)، المعالج، الكرت بضغطة زر واحدة وبدون إعادة فرمتة.
              </p>
            </Card>

            <Card variant="glass" className="hover:border-emerald-500/45 transition-all group cursor-default p-6 bg-[#0D1829] border border-sky-900/20 shadow-none">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all shadow-inner">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2 font-alexandria tracking-wide">دعم كامل للألعاب</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                متوافق تماماً مع حمايات EAC, BE, Vanguard وجميع أنظمة مكافحة الغش في الألعاب الرئيسية.
              </p>
            </Card>
          </div>

          <Card variant="glass" className="border-l-4 border-l-amber-500 bg-gradient-to-l from-amber-500/5 to-transparent p-6 shadow-xl shadow-amber-500/5">
            <h3 className="font-bold text-amber-400 text-base flex items-center gap-2 mb-4 font-alexandria">
              <Terminal className="w-5 h-5" /> مسار الإعداد السريع
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-sm text-gray-300 font-medium">
              <li className="pl-2">تأكد من تحميل ملف اللودر من صفحة <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded text-xs mx-1">منتجاتي</span>.</li>
              <li className="pl-2">قم بتحديث الـ BIOS الخاص بك لأحدث إصدار متوافق.</li>
              <li className="pl-2">تأكد من تعطيل <span className="text-rose-400 font-mono text-xs bg-rose-400/10 px-1 rounded mx-1">Secure Boot</span> بشكل كامل.</li>
              <li className="pl-2">شغل الأداة كمسؤول (Run as Administrator).</li>
            </ol>
          </Card>
        </div>
      )
    },
    {
      id: 'step1-bios',
      title: 'تحديث البايوس (BIOS)',
      category: 'الإعداد الأساسي',
      icon: <Cpu className="w-4 h-4 text-sky-400" />,
      content: (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black text-white mb-2 font-alexandria">تحديث وتفليش البايوس</h1>
            <p className="text-sm text-gray-400">
              تفليش الـ BIOS يضمن تغيير السيريال الخاص بمذربورد جهازك وإعادة ضبط المعرفات.
            </p>
          </div>

          <Card variant="glass" className="space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-500" /> المتطلبات الأساسية
            </h3>
            <ul className="space-y-3 text-xs text-gray-300 pr-2">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
                <span>فلاش ميموري (USB Flash Drive) بتهيئة FAT32.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
                <span>معرفة موديل المذربورد الخاص بك.</span>
              </li>
            </ul>
          </Card>

          <div className="bg-[#070E1A] p-4 rounded-xl border border-sky-900/20 font-mono text-xs text-sky-400 relative">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-sky-900/20 text-zinc-400 font-sans">
              <span>أمر معرفة موديل المذربورد (CMD)</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => copyToClipboard('wmic baseboard get product,Manufacturer,version,serialnumber', 1)}
                leftIcon={copiedCodeIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedCodeIndex === 1 ? 'تم النسخ' : 'نسخ'}
              </Button>
            </div>
            <code>wmic baseboard get product,Manufacturer,version,serialnumber</code>
          </div>
        </div>
      )
    },
    {
      id: 'step2-config',
      title: 'إعدادات الأمان',
      category: 'الإعداد الأساسي',
      icon: <Wrench className="w-4 h-4 text-sky-400" />,
      content: (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black text-white mb-2 font-alexandria">إعدادات الأمان في BIOS</h1>
            <p className="text-sm text-gray-400">يجب ضبط هذه الخيارات لضمان نجاح التخطي.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card variant="glass">
              <div className="flex items-center gap-2 font-bold text-white text-sm mb-3">
                <Lock className="w-4 h-4 text-amber-500" /> تعطيل Secure Boot
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                يجب تعطيل الإقلاع الآمن لتسمح للأداة بتنفيذ الأوامر بنجاح على مستوى النظام.
              </p>
            </Card>
            <Card variant="glass">
              <div className="flex items-center gap-2 font-bold text-white text-sm mb-3">
                <Cpu className="w-4 h-4 text-sky-500" /> تعطيل TPM
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                يجب تعطيل Trusted Platform Module لمنع تسجيل البصمة العتادية الجديدة.
              </p>
            </Card>
          </div>
        </div>
      )
    }
  ];

  const filteredDocs = docSections.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group docs by category
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const cat = doc.category || 'أخرى';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {} as Record<string, DocSection[]>);

  const activeDoc = docSections.find(d => d.id === activeDocId) || docSections[0];

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-8rem)] w-full">
      {/* Sidebar Navigation */}
      <Card variant="glass" className="w-full lg:w-80 shrink-0 p-5 sticky top-24 h-max flex flex-col gap-5 border-sky-900/25 bg-[#0D1829] shadow-none">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500/50" />
          <input
            type="text"
            placeholder="البحث في الدليل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070E1A] border border-sky-900/30 rounded-xl py-3 pr-10 pl-4 text-sm text-white placeholder-zinc-500 focus:border-sky-500/50 outline-none transition-all focus:ring-2 focus:ring-sky-500/10 shadow-inner"
          />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6 max-h-[60vh]">
          {Object.entries(groupedDocs).map(([category, docs]) => (
            <div key={category}>
              <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500/50"></span>
                {category}
              </h4>
              <div className="space-y-1.5">
                {docs.map((doc) => {
                  const isActive = activeDocId === doc.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setActiveDocId(doc.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all duration-300 group
                        ${isActive 
                          ? 'bg-sky-500/10 text-white border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.15)]' 
                          : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border border-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-sky-500/20 text-sky-400' : 'bg-white/[0.05] text-zinc-500 group-hover:bg-white/[0.1] group-hover:text-zinc-300'}`}>
                          {doc.icon}
                        </span>
                        <span>{doc.title}</span>
                      </div>
                      {isActive && (
                        <ChevronLeft className="w-4 h-4 text-sky-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {filteredDocs.length === 0 && (
            <div className="text-center py-8 text-sm text-zinc-500 bg-white/[0.02] rounded-xl border border-dashed border-sky-900/20">
              لا توجد نتائج مطابقة
            </div>
          )}
        </div>
      </Card>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 bg-[#0D1829]/50 rounded-2xl border border-sky-900/20 p-2 sm:p-6 shadow-inner">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDoc.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="pb-12"
          >
            {activeDoc.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

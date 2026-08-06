import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, Save, Webhook, Globe, Mail, Link as LinkIcon, Shield } from 'lucide-react';
import { apiFetch } from '../../api.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';

interface ToastFunctions {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

export function AdminSettingsPage({ toast }: { toast: ToastFunctions }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteTitle: '',
    discordWebhookUrl: '',
    googleClientId: ''
  });

  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        const data = await apiFetch('/admin/settings');
        if (mounted && data.settings) {
          setSettings(data.settings);
        }
      } catch (error) {
        if (mounted) toast.error('خطأ', 'فشل في جلب الإعدادات');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSettings();
    return () => { mounted = false; };
  }, [toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      toast.success('نجاح', 'تم حفظ الإعدادات بنجاح');
    } catch (error) {
      toast.error('خطأ', 'فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <Card variant="gradient" className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-sky-500/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-alexandria flex items-center gap-3">
            <Settings className="w-6 h-6 text-sky-400" />
            إعدادات النظام (Settings)
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            تكوين إعدادات المنصة الأساسية، الربط مع الخدمات الخارجية، وإدارة الهوية.
          </p>
        </div>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400 font-mono text-sm animate-pulse">
            جاري تحميل الإعدادات...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* General Settings */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="col-span-12 md:col-span-7">
              <Card variant="glass" className="h-full border-white/[0.05]">
                <h2 className="text-lg font-bold text-white mb-6 font-alexandria flex items-center gap-2 border-b border-white/[0.05] pb-4">
                  <Globe className="w-5 h-5 text-sky-400" />
                  الإعدادات العامة
                </h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 ml-1">عنوان الموقع (Site Title)</label>
                    <input 
                      type="text" 
                      value={settings.siteTitle || ''} 
                      onChange={(e) => setSettings({...settings, siteTitle: e.target.value})} 
                      className="w-full bg-[#030712] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all" 
                      placeholder="TA3N Store" 
                    />
                    <p className="text-[10px] text-gray-500 mt-1 ml-1">يظهر في عنوان المتصفح ومحركات البحث</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Integrations */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-12 md:col-span-5 space-y-6">
              
              <Card variant="glass" className="border-indigo-500/10">
                <h2 className="text-lg font-bold text-white mb-6 font-alexandria flex items-center gap-2 border-b border-white/[0.05] pb-4">
                  <Webhook className="w-5 h-5 text-indigo-400" />
                  ربط الخدمات (Integrations)
                </h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 ml-1 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-gray-400" />
                      رابط Discord Webhook
                    </label>
                    <input 
                      type="url" 
                      value={settings.discordWebhookUrl || ''} 
                      onChange={(e) => setSettings({...settings, discordWebhookUrl: e.target.value})} 
                      className="w-full bg-[#030712] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all text-left font-mono" 
                      placeholder="https://discord.com/api/webhooks/..." 
                      dir="ltr"
                    />
                    <p className="text-[10px] text-gray-500 mt-1 ml-1 leading-relaxed">
                      يستخدم لإرسال الإشعارات وعمليات الشراء والتفعيلات إلى خادم ديسكورد الخاص بك بشكل فوري.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card variant="glass" className="border-rose-500/10">
                <h2 className="text-lg font-bold text-white mb-6 font-alexandria flex items-center gap-2 border-b border-white/[0.05] pb-4">
                  <Shield className="w-5 h-5 text-rose-400" />
                  المصادقة وتسجيل الدخول
                </h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 ml-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      Google Client ID
                    </label>
                    <input 
                      type="text" 
                      value={settings.googleClientId || ''} 
                      onChange={(e) => setSettings({...settings, googleClientId: e.target.value})} 
                      className="w-full bg-[#030712] border border-white/[0.08] focus:border-rose-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all text-left font-mono" 
                      placeholder="xxxx-xxxx.apps.googleusercontent.com" 
                      dir="ltr"
                    />
                    <p className="text-[10px] text-gray-500 mt-1 ml-1 leading-relaxed">
                      مطلوب لتفعيل ميزة تسجيل الدخول السريع باستخدام حسابات Google (OAuth 2.0).
                    </p>
                  </div>
                </div>
              </Card>

            </motion.div>

            {/* Save Action */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="col-span-12">
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  isLoading={saving}
                  leftIcon={<Save className="w-4 h-4" />}
                  className="px-8"
                >
                  حفظ الإعدادات
                </Button>
              </div>
            </motion.div>
            
          </div>
        )}
      </form>
    </div>
  );
}

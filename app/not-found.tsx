export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4" dir="rtl">
      <h1 className="text-6xl font-black text-sky-400 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-white mb-4">الصفحة غير موجودة</h2>
      <p className="text-sm text-slate-400 max-w-md mb-8">
        عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى عنوان آخر في متجر تعن.
      </p>
      <a
        href="/"
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold text-xs shadow-lg hover:scale-105 transition-all"
      >
        العودة للصفحة الرئيسية
      </a>
    </div>
  );
}

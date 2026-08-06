import { ProductStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ProductStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Active':
      case 'نشط':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Inactive':
      case 'غير نشط':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Suspended':
      case 'موقوف':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'Active':
        return 'نشط';
      case 'Inactive':
        return 'غير نشط';
      case 'Suspended':
        return 'موقوف';
      default:
        return status;
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        getBadgeStyle(),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {getLabel()}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/90 text-sky-400 border border-sky-500/20 shadow-sm backdrop-blur-md">
      {category}
    </span>
  );
}

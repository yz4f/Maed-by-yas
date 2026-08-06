import React from 'react';
import { Menu } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  user: { name: string; email: string; avatar?: string; role: string } | null;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  user,
  onToggleSidebar
}) => {
  return (
    <header className="sticky top-0 z-30 h-14 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/[0.04] px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar} 
          className="md:hidden p-2 -mr-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold text-white">{title}</h1>
          {subtitle && <span className="text-[11px] text-zinc-500 hidden sm:inline">{subtitle}</span>}
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-300">{user.name}</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-500 font-medium tracking-wider">
              {user.role}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-white">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

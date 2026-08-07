/**
 * DashboardLayout.tsx
 * 
 * Shared layout component used by all dashboard pages.
 * Renders a fixed left/right sidebar, a fixed background grid, and a main content
 * wrapper that dynamically toggles scrollability based on content overflow using useAutoScroll.
 */

import React from 'react';
import { useAutoScroll } from '@/hooks/useAutoScroll';

interface DashboardLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  lang: 'ar' | 'en';
}

export function DashboardLayout({ sidebar, children, lang }: DashboardLayoutProps) {
  const contentWrapperRef = useAutoScroll();

  return (
    <div 
      className="min-h-screen md:h-screen md:overflow-hidden bg-[#0B0E14] text-[#F5F5F7] flex flex-col md:flex-row selection:bg-[#6366F1] selection:text-white relative"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Background Grid - Fixed background layer */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0" />
      
      {/* Sidebar container - Fixed width, non-scrollable layout boundary */}
      <div className="w-full md:w-[260px] shrink-0 z-10 md:h-full flex flex-col border-r border-white/[0.06] bg-[#0B0E14]">
        {sidebar}
      </div>

      {/* Main Content Area - Monitored by useAutoScroll to dynamically toggle scrolling */}
      <div 
        ref={contentWrapperRef} 
        className="flex-grow h-full p-6 md:p-10 z-10 relative scrollbar-none"
        style={{
          scrollbarGutter: 'stable',
          transition: 'overflow-y 150ms ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}

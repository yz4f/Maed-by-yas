/**
 * LayoutExample.tsx
 * 
 * Example usage demonstration for DashboardLayout and useAutoScroll.
 * Demonstrates how a short page (Overview) and a long page (Products) render inside
 * the unified layout. The scrollbar behavior toggles automatically based on content size.
 */

import React, { useState } from 'react';
import { DashboardLayout } from './DashboardLayout';

export function ExampleUsage() {
  const [currentPage, setCurrentPage] = useState<'short' | 'long'>('short');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  // Simple Sidebar representation for demo purposes
  const sidebarContent = (
    <div className="p-5 flex flex-col justify-between h-full">
      <div>
        <div className="font-extrabold text-lg mb-8 tracking-wider">TA3N PORTAL</div>
        <nav className="space-y-3">
          <button 
            onClick={() => setCurrentPage('short')}
            className={`w-full text-start px-4 py-2.5 rounded-xl font-bold transition-all ${
              currentPage === 'short' ? 'bg-[#141822] text-white' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            Overview (Short Page)
          </button>
          <button 
            onClick={() => setCurrentPage('long')}
            className={`w-full text-start px-4 py-2.5 rounded-xl font-bold transition-all ${
              currentPage === 'long' ? 'bg-[#141822] text-white' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            Products (Long Page)
          </button>
        </nav>
      </div>
      <div>
        <button 
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="text-xs text-[#9CA3AF] hover:text-white font-bold"
        >
          Language: {lang.toUpperCase()}
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout sidebar={sidebarContent} lang={lang}>
      {currentPage === 'short' ? (
        /* SHORT PAGE - Fits inside viewport. Scrollbar automatically hidden */
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Overview Dashboard</h1>
          <p className="text-[#9CA3AF]">
            This page has brief content. No scrollbar will appear, and the viewport is locked.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#141822] p-6 rounded-xl border border-white/[0.06]">
              <div className="text-sm text-[#9CA3AF]">Active Subscriptions</div>
              <div className="text-2xl font-bold mt-1">2</div>
            </div>
            <div className="bg-[#141822] p-6 rounded-xl border border-white/[0.06]">
              <div className="text-sm text-[#9CA3AF]">System Status</div>
              <div className="text-2xl font-bold text-[#34D399] mt-1">Online</div>
            </div>
          </div>
        </div>
      ) : (
        /* LONG PAGE - Exceeds viewport. Scrollbar activates dynamically */
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">All Products</h1>
          <p className="text-[#9CA3AF]">
            This page contains many products. The ContentWrapper dynamically detects this overflow
            and enables smooth scrolling for this area only. The Sidebar remains completely static.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="bg-[#141822] p-6 rounded-xl border border-white/[0.06]">
                <h3 className="font-bold">Software Product #{idx + 1}</h3>
                <p className="text-xs text-[#9CA3AF] mt-2">
                  Premium utility with anti-detection features and automated key licensing systems.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

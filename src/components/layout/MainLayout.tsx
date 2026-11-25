'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading && !currentUser && !isLoginPage) {
      router.push('/login');
    }
  }, [currentUser, isLoading, isLoginPage, router]);

  // If on Login page, render clean full-screen layout without navigation bars
  if (isLoginPage) {
    return <main className="min-h-screen bg-slate-900">{children}</main>;
  }

  // Loading state when checking authentication
  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 text-white">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gold-400">
              ✝
            </div>
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white tracking-wide">
              GEREJA KRISTEN KASIH ANUGERAH
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Memvalidasi Sesi Masuk Pengurus...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased relative">
      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setIsMobileSidebarOpen((prev) => !prev)} />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};

import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { MainLayout } from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'Church Management System | Sistem Informasi Gereja Terintegrasi',
  description: 'Sistem Informasi Gereja Modern, Terintegrasi, dan Siap Operasional',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <NotificationProvider>
            <MainLayout>{children}</MainLayout>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

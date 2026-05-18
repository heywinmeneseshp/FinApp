import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'FinApp - Finanzas para Emprendedores',
  description: 'Domina las finanzas de tu negocio con educación gamificada.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FinApp',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#12C2A2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

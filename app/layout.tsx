import type { Metadata } from 'next';
import './globals.css';
import ClientSessionProvider from './ClientSessionProvider';

export const metadata: Metadata = {
  title: 'FinApp Profesional',
  description: 'Gestión financiera inteligente para emprendedores',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ClientSessionProvider>{children}</ClientSessionProvider>
      </body>
    </html>
  );
}

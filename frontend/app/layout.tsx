import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'The Path of Function',
  description: 'An interactive learning game about programming functions',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">

      <body className="bg-[#F7F3EA] text-[#2E2E2E] h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}

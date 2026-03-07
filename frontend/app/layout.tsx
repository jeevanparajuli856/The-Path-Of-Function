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

      <body className="bg-[#F7F3EA] text-[#2E2E2E] min-h-screen">
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">
            {children}
          </main>
          <footer className="text-center py-4 text-sm text-[#6AA6D9]">
            <p>© 2024 The Path of Function - An Interactive Learning Experience</p>
          </footer>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'The Path of Function',
  description: 'An interactive learning game about programming functions',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gradient-to-br from-slate-900 to-slate-800 text-white min-h-screen">
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">
            {children}
          </main>
          <footer className="text-center py-4 text-sm text-slate-400">
            <p>© 2024 The Path of Function - An Interactive Learning Experience</p>
          </footer>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Meals for Raquel',
  description: 'Coordinate home-cooked meals for our team member',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <header className="bg-white shadow-sm">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                Meals for Raquel
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  href="/meals"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  View Meals
                </Link>
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Admin
                </Link>
              </div>
            </div>
          </nav>
        </header>

        <main className="container mx-auto px-4 py-8">{children}</main>

        <footer className="bg-white border-t mt-auto">
          <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
            <p>Made with love for Raquel</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

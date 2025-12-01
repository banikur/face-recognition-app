import TopBar from '@/components/TopBar';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Face Wash Recommendation System',
  description: 'Get personalized face wash recommendations based on your skin condition',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="compact vh-full">
        <div className="vh-full bg-gray-50">
          <TopBar />
          <main className="h-[calc(100vh-56px)]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

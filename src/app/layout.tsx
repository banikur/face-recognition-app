import TopBar from '@/components/TopBar';
import ModelLoader from '@/components/ModelLoader';
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className="compact vh-full">
        <ModelLoader>
          <div className="vh-full bg-gray-50">
            <TopBar />
            <main className="h-[calc(100vh-56px)] h-[calc(100dvh-56px)]">
              {children}
            </main>
          </div>
        </ModelLoader>
      </body>
    </html>
  );
}

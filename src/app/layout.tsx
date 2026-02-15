import ModelLoader from '@/components/ModelLoader';
import AppShell from '@/components/AppShell';
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
          <AppShell>{children}</AppShell>
        </ModelLoader>
      </body>
    </html>
  );
}

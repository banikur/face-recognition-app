import ModelLoader from '@/components/ModelLoader';
import AppShell from '@/components/AppShell';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Face Analytic — Skin Condition Analysis',
  description: 'Analisis kondisi kulit wajah berbasis AI dan rekomendasi produk skincare',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <ModelLoader>
          <AppShell>{children}</AppShell>
        </ModelLoader>
      </body>
    </html>
  );
}

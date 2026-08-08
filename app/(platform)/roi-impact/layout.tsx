import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'ROI e Impacto' };

export default function RoiImpactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Monitoria e Avaliação' };

export default function MonitoringOkrsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

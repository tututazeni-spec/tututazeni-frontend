import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard Institucional' };

export default function DashboardInstitutionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

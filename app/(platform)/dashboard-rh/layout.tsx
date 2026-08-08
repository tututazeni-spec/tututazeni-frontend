import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard RH' };

export default function DashboardRhLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

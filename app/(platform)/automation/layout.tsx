import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Automações' };

export default function AutomationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

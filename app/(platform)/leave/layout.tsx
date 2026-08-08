import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Férias e Licenças' };

export default function LeaveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

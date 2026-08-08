import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Recibos Salariais' };

export default function PayslipsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

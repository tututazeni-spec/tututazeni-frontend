import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Matrículas' };

export default function EnrollmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

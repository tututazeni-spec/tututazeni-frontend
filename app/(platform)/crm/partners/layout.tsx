import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Parceiros' };

export default function CrmPartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

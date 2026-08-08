import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Organograma' };

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Eventos Corporativos' };

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

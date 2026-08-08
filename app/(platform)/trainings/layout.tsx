import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Formações' };

export default function TrainingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

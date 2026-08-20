import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Formação com Avatar' };

export default function AvatarTrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

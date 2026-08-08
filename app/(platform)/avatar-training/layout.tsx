import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Treino de Avatar' };

export default function AvatarTrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

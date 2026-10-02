import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Avatar Training' };

export default function AvatarTrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

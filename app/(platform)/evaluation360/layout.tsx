import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Avaliação 360°' };

export default function Evaluation360Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

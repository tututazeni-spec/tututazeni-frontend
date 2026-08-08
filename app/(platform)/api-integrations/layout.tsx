import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integrações com Sistemas Externos',
};

export default function ApiIntegrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

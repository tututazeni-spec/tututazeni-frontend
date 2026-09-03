import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Folha de Pagamento' };

export default function PayrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

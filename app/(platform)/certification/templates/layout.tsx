import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Templates Certificado' };

export default function CertificationTemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

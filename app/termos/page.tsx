import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { TERMOS } from '@/content/legal/termos';

export const metadata: Metadata = { title: 'Termos de utilização' };

export default function TermosPage() {
  return <LegalDocument doc={TERMOS} />;
}

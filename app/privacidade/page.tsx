import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { PRIVACIDADE } from '@/content/legal/privacidade';

export const metadata: Metadata = { title: 'Política de privacidade' };

export default function PrivacidadePage() {
  return <LegalDocument doc={PRIVACIDADE} />;
}

'use client';

import { useCertificateTemplates } from '@/hooks/useCertificateTemplates';
import { TemplatesView } from '@/components/certification/TemplatesView';

export default function CertificateTemplatesPage() {
  const props = useCertificateTemplates();
  return <TemplatesView {...props} />;
}

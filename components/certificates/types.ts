// Resposta de GET /certificates/verify/:code (pública, só campos mínimos).
export type CertificateStatus =
  'PENDING' | 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface PublicVerifyResult {
  valid: boolean;
  status: CertificateStatus;
  holderName: string;
  title: string;
  issuerName: string;
  hours: number | null;
  issuedAt: string;
  expiresAt: string | null;
  type: string;
}

export type VerifyCardResult = PublicVerifyResult | { notFound: true };

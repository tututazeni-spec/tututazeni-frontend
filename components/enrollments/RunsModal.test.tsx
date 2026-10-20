import { describe, expect, it } from 'vitest';
import { certificateLabel } from './RunsModal';

const base = {
  id: 1,
  status: 'ACTIVE',
  revoked: false,
  issuedAt: '2026-01-01T00:00:00Z',
  expiresAt: null,
  code: 'ABC',
  current: false,
};

describe('certificateLabel', () => {
  it('o certificado vigente destaca-se do válido histórico', () => {
    expect(certificateLabel({ ...base, current: true })).toBe('Vigente');
    expect(certificateLabel(base)).toBe('Válido');
  });

  it('expirado e revogado nunca aparecem como vigentes', () => {
    const now = new Date('2026-06-01').getTime();
    expect(
      certificateLabel(
        { ...base, current: true, expiresAt: '2026-05-01T00:00:00Z' },
        now,
      ),
    ).toBe('Expirado');
    expect(certificateLabel({ ...base, status: 'EXPIRED' })).toBe('Expirado');
    expect(certificateLabel({ ...base, revoked: true, current: true })).toBe(
      'Revogado',
    );
  });
});

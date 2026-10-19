import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerifyResultCard } from './VerifyResultCard';
import type { PublicVerifyResult } from './types';

const base: PublicVerifyResult = {
  valid: true,
  status: 'ACTIVE',
  holderName: 'Ana Silva Pereira',
  title: 'Segurança no Trabalho',
  issuerName: 'INNOVA',
  hours: 8,
  issuedAt: '2026-10-01T00:00:00.000Z',
  expiresAt: null,
  type: 'COURSE',
  origin: 'INTERNAL',
};

describe('VerifyResultCard', () => {
  test('certificado activo mostra nome completo, curso e estado válido', () => {
    render(<VerifyResultCard result={base} />);
    expect(screen.getByText('Ana Silva Pereira')).toBeInTheDocument();
    expect(screen.getByText('Segurança no Trabalho')).toBeInTheDocument();
    expect(screen.getByText('Certificado válido')).toBeInTheDocument();
  });

  test('revogado mostra "Revogado" e nunca "válido"', () => {
    render(
      <VerifyResultCard
        result={{ ...base, valid: false, status: 'REVOKED' }}
      />,
    );
    expect(screen.getByText('Certificado revogado')).toBeInTheDocument();
    expect(screen.queryByText('Certificado válido')).not.toBeInTheDocument();
  });

  test('expirado mostra "Expirado" e nunca "válido"', () => {
    render(
      <VerifyResultCard
        result={{
          ...base,
          valid: false,
          status: 'EXPIRED',
          expiresAt: '2026-01-01T00:00:00.000Z',
        }}
      />,
    );
    expect(screen.getByText('Certificado expirado')).toBeInTheDocument();
    expect(screen.queryByText('Certificado válido')).not.toBeInTheDocument();
  });

  test('não encontrado usa um aviso claro', () => {
    render(<VerifyResultCard result={{ notFound: true }} />);
    expect(screen.getByText('Certificado não encontrado')).toBeInTheDocument();
  });

  test('externo diz que foi importado e emitido por outra entidade, não pela academia', () => {
    render(
      <VerifyResultCard
        result={{ ...base, origin: 'EXTERNAL', issuerName: 'Cruz Vermelha' }}
      />,
    );
    expect(screen.getByText('Certificado externo')).toBeInTheDocument();
    expect(
      screen.getByText(/emitido por Cruz Vermelha, não pela academia/),
    ).toBeInTheDocument();
  });

  test('interno não mostra o aviso de certificado externo', () => {
    render(<VerifyResultCard result={base} />);
    expect(screen.queryByText('Certificado externo')).not.toBeInTheDocument();
  });
});

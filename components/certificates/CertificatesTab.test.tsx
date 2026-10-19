import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CertificatesTab } from './CertificatesTab';
import type { AdminCertificateRow } from './types';

const row = (over: Partial<AdminCertificateRow> = {}): AdminCertificateRow => ({
  id: 1,
  holderName: 'Ana Silva',
  departmentName: 'RH',
  title: 'Segurança',
  activityKind: 'COURSE',
  status: 'ACTIVE',
  code: 'ABCD1234EFGH5678',
  issuedAt: '2026-10-01T00:00:00.000Z',
  expiresAt: null,
  hours: 8,
  ...over,
});

let rows: AdminCertificateRow[] = [];
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_k: unknown, path: string) =>
    path === '/departments'
      ? { data: [], isLoading: false }
      : {
          data: {
            data: rows,
            total: rows.length,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
          isLoading: false,
          error: null,
        },
  useApiMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/hooks/usePdfDownload', () => ({
  usePdfDownload: () => ({ download: vi.fn(), loading: false, error: null }),
}));
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => vi.fn() }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

describe('CertificatesTab', () => {
  beforeEach(() => {
    rows = [];
  });

  test('pendente de aprovação mostra "Aprovar" a quem pode aprovar', () => {
    rows = [row({ status: 'PENDING_APPROVAL' })];
    render(<CertificatesTab canApprove />);
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument();
  });

  test('auditor (só leitura) não vê "Aprovar"', () => {
    rows = [row({ status: 'PENDING_APPROVAL' })];
    render(<CertificatesTab canApprove={false} />);
    expect(
      screen.queryByRole('button', { name: 'Aprovar' }),
    ).not.toBeInTheDocument();
  });

  test('revogado não tem "Descarregar PDF"; válido tem', () => {
    rows = [
      row({ id: 1, status: 'REVOKED' }),
      row({ id: 2, status: 'ACTIVE' }),
    ];
    render(<CertificatesTab canApprove />);
    expect(
      screen.getAllByRole('button', { name: 'Descarregar PDF' }),
    ).toHaveLength(1);
  });

  test('lista vazia mostra o estado vazio', () => {
    render(<CertificatesTab canApprove />);
    expect(screen.getByText('Sem certificados')).toBeInTheDocument();
  });

  test('nenhum enum cru aparece no ecrã', () => {
    rows = [
      row({ status: 'PENDING_APPROVAL' }),
      row({ id: 2, status: 'ACTIVE' }),
    ];
    render(<CertificatesTab canApprove />);
    expect(
      screen.queryByText(/PENDING_APPROVAL|^ACTIVE$|COURSE/),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Aguarda aprovação')).toBeInTheDocument();
  });
});

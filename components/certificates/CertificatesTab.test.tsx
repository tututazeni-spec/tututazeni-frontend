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
  origin: 'INTERNAL',
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
    render(<CertificatesTab canManage canApprove />);
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument();
  });

  test('auditor (só leitura) não vê "Aprovar"', () => {
    rows = [row({ status: 'PENDING_APPROVAL' })];
    render(<CertificatesTab canManage={false} canApprove={false} />);
    expect(
      screen.queryByRole('button', { name: 'Aprovar' }),
    ).not.toBeInTheDocument();
  });

  test('revogado não tem "Descarregar PDF"; válido tem', () => {
    rows = [
      row({ id: 1, status: 'REVOKED' }),
      row({ id: 2, status: 'ACTIVE' }),
    ];
    render(<CertificatesTab canManage canApprove />);
    expect(
      screen.getAllByRole('button', { name: 'Descarregar PDF' }),
    ).toHaveLength(1);
  });

  test('lista vazia mostra o estado vazio', () => {
    render(<CertificatesTab canManage canApprove />);
    expect(screen.getByText('Sem certificados')).toBeInTheDocument();
  });

  test('nenhum enum cru aparece no ecrã', () => {
    rows = [
      row({ status: 'PENDING_APPROVAL' }),
      row({ id: 2, status: 'ACTIVE' }),
    ];
    render(<CertificatesTab canManage canApprove />);
    expect(
      screen.queryByText(/PENDING_APPROVAL|^ACTIVE$|COURSE/),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Aguarda aprovação')).toBeInTheDocument();
  });

  const has = (name: string) => screen.queryByRole('button', { name }) !== null;

  test('válido interno oferece revogar, reemitir e reenviar a quem gere', () => {
    rows = [row({ status: 'ACTIVE' })];
    render(<CertificatesTab canManage canApprove />);
    expect(has('Revogar')).toBe(true);
    expect(has('Reemitir')).toBe(true);
    expect(has('Reenviar')).toBe(true);
  });

  test('auditor não vê nenhuma acção de ciclo de vida nem importar/lote', () => {
    rows = [row({ status: 'ACTIVE' })];
    render(<CertificatesTab canManage={false} canApprove={false} />);
    for (const n of [
      'Revogar',
      'Reemitir',
      'Reenviar',
      'Importar certificado externo',
      'Emitir em lote',
    ]) {
      expect(has(n)).toBe(false);
    }
  });

  test('externo não se reemite mas pode ser revogado', () => {
    rows = [row({ origin: 'EXTERNAL', status: 'ACTIVE' })];
    render(<CertificatesTab canManage canApprove />);
    expect(has('Reemitir')).toBe(false);
    expect(has('Revogar')).toBe(true);
  });

  test('revogado não tem acções de ciclo de vida', () => {
    rows = [row({ status: 'REVOKED' })];
    render(<CertificatesTab canManage canApprove />);
    expect(has('Revogar') || has('Reemitir') || has('Reenviar')).toBe(false);
  });

  test('revogado tem "Remover da lista" para quem gere; válido e auditor não', () => {
    rows = [row({ status: 'REVOKED' })];
    const { unmount } = render(<CertificatesTab canManage canApprove />);
    expect(has('Remover da lista')).toBe(true);
    unmount();
    render(<CertificatesTab canManage={false} canApprove={false} />);
    expect(has('Remover da lista')).toBe(false);
  });

  test('válido não tem "Remover da lista"', () => {
    rows = [row({ status: 'ACTIVE' })];
    render(<CertificatesTab canManage canApprove />);
    expect(has('Remover da lista')).toBe(false);
  });

  test('pendente de aprovação pode ser aprovado ou revogado, não reemitido', () => {
    rows = [row({ status: 'PENDING_APPROVAL' })];
    render(<CertificatesTab canManage canApprove />);
    expect(has('Aprovar')).toBe(true);
    expect(has('Revogar')).toBe(true);
    expect(has('Reemitir')).toBe(false);
  });

  test('quem gere vê os botões de importar e de emitir em lote', () => {
    render(<CertificatesTab canManage canApprove />);
    expect(has('Importar certificado externo')).toBe(true);
    expect(has('Emitir em lote')).toBe(true);
  });

  test('externo mostra a etiqueta "Externo" na lista', () => {
    rows = [row({ origin: 'EXTERNAL' })];
    render(<CertificatesTab canManage canApprove />);
    expect(screen.getByText('Externo')).toBeInTheDocument();
  });

  test('gestor (só aprova): vê "Aprovar" mas não revogar, reemitir, importar nem lote', () => {
    rows = [
      row({ status: 'PENDING_APPROVAL' }),
      row({ id: 2, status: 'ACTIVE' }),
    ];
    render(<CertificatesTab canManage={false} canApprove />);
    expect(has('Aprovar')).toBe(true);
    for (const n of [
      'Revogar',
      'Reemitir',
      'Reenviar',
      'Importar certificado externo',
      'Emitir em lote',
    ]) {
      expect(has(n)).toBe(false);
    }
  });

  test('todos os que veem a lista podem exportar', () => {
    render(<CertificatesTab canManage={false} canApprove={false} />);
    expect(has('Exportar CSV')).toBe(true);
    expect(has('Exportar Excel')).toBe(true);
    expect(has('Exportar PDF')).toBe(true);
  });
});

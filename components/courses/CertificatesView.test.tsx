import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { CertificatesView } from './CertificatesView';
import type { Certificate } from './types';
import type { MySummary } from '@/components/certificates/types';

const cert = (over: Partial<Certificate> = {}): Certificate => ({
  id: 1,
  code: 'AAAA1111BBBB2222',
  validationCode: 'AAAA1111BBBB2222',
  status: 'ACTIVE',
  displayTitle: 'Segurança no Trabalho',
  activityKind: 'COURSE',
  origin: 'INTERNAL',
  issuedAt: '2026-03-01T00:00:00.000Z',
  expiresAt: null,
  verifyUrl: 'https://app.test/verify/AAAA1111BBBB2222',
  linkedInUrl:
    'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME',
  course: null,
  ...over,
});

let certs: Certificate[] = [];
let summary: MySummary = {
  emailEnabled: false,
  pending: [],
  expiringSoon: [],
  mandatoryMissing: [],
};

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_k: unknown, path: string) =>
    path === '/certificates/my/summary'
      ? { data: summary, isLoading: false }
      : { data: certs, isLoading: false },
  useApiMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/hooks/usePdfDownload', () => ({
  usePdfDownload: () => ({ download: vi.fn(), loading: false, error: null }),
}));
vi.mock('@/providers/ConfirmProvider', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
const toast = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => toast }));

const has = (name: string) => screen.queryByRole('button', { name }) !== null;

describe('CertificatesView — área pessoal', () => {
  beforeEach(() => {
    certs = [];
    summary = {
      emailEnabled: false,
      pending: [],
      expiringSoon: [],
      mandatoryMissing: [],
    };
    toast.mockReset();
  });

  test('"Enviar por e-mail" só aparece quando o SMTP está configurado', () => {
    certs = [cert()];
    const { unmount } = render(<CertificatesView />);
    expect(has('Enviar por e-mail')).toBe(false);
    unmount();
    summary = { ...summary, emailEnabled: true };
    render(<CertificatesView />);
    expect(has('Enviar por e-mail')).toBe(true);
  });

  test('"LinkedIn" só em certificados com ligação oficial', () => {
    certs = [cert({ id: 1 }), cert({ id: 2, linkedInUrl: undefined })];
    render(<CertificatesView />);
    expect(
      screen.getAllByRole('button', { name: 'Adicionar ao LinkedIn' }),
    ).toHaveLength(1);
  });

  test('revogado mostra o estado e não oferece PDF, LinkedIn nem e-mail', () => {
    summary = { ...summary, emailEnabled: true };
    certs = [cert({ status: 'REVOKED', linkedInUrl: undefined })];
    render(<CertificatesView />);
    expect(screen.getAllByText('Revogado').length).toBeGreaterThan(0);
    expect(
      has('Download PDF') ||
        has('Adicionar ao LinkedIn') ||
        has('Enviar por e-mail'),
    ).toBe(false);
  });

  test('o filtro de estado "Expirados" esconde os válidos e mostra a contagem', () => {
    certs = [
      cert({ id: 1, displayTitle: 'Válido A' }),
      cert({
        id: 2,
        displayTitle: 'Expirado B',
        status: 'EXPIRED',
        linkedInUrl: undefined,
      }),
      cert({ id: 3, displayTitle: 'Válido C' }),
    ];
    render(<CertificatesView />);
    expect(screen.getByText('3 de 3')).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole('tablist', { name: 'Estado' })).getByText(
        'Expirados',
      ),
    );
    expect(screen.getByText('1 de 3')).toBeInTheDocument();
    expect(screen.getByText('Expirado B')).toBeInTheDocument();
    expect(screen.queryByText('Válido A')).not.toBeInTheDocument();
  });

  test('a pesquisa filtra por título', () => {
    certs = [
      cert({ id: 1, displayTitle: 'Segurança' }),
      cert({ id: 2, displayTitle: 'Liderança' }),
    ];
    render(<CertificatesView />);
    fireEvent.change(screen.getByPlaceholderText('Pesquisar por formação'), {
      target: { value: 'lider' },
    });
    expect(screen.getByText('Liderança')).toBeInTheDocument();
    expect(screen.queryByText('Segurança')).not.toBeInTheDocument();
  });

  test('"Copiar ligação" copia a ligação pública de verificação', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    certs = [cert()];
    render(<CertificatesView />);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar ligação' }));
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledWith(
      'https://app.test/verify/AAAA1111BBBB2222',
    );
  });

  test('nenhum enum cru aparece no ecrã', () => {
    certs = [
      cert({ status: 'PENDING_APPROVAL', activityKind: 'LEARNING_PATH' }),
    ];
    render(<CertificatesView />);
    expect(
      screen.queryByText(/PENDING_APPROVAL|LEARNING_PATH|^ACTIVE$/),
    ).not.toBeInTheDocument();
  });

  test('sem certificados mostra o estado vazio', () => {
    render(<CertificatesView />);
    expect(screen.getByText('Sem certificados ainda')).toBeInTheDocument();
  });
});

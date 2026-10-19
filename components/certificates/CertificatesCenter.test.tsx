import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CertificatesCenter } from './CertificatesCenter';

let role: string | undefined;
vi.mock('@/hooks/useCurrentRole', () => ({ useCurrentRole: () => role }));
vi.mock('@/components/courses/CertificatesView', () => ({
  CertificatesView: () => <div data-testid="my-certificates" />,
}));
vi.mock('./OverviewTab', () => ({
  OverviewTab: () => <div>overview-tab</div>,
}));
vi.mock('./CertificatesTab', () => ({
  CertificatesTab: () => <div>certificates-tab</div>,
}));
vi.mock('./TemplatesTab', () => ({
  TemplatesTab: () => <div>templates-tab</div>,
}));
vi.mock('./RulesTab', () => ({ RulesTab: () => <div>rules-tab</div> }));
vi.mock('./HistoryTab', () => ({ HistoryTab: () => <div>history-tab</div> }));

describe('CertificatesCenter', () => {
  beforeEach(() => {
    role = undefined;
  });

  test('colaborador vê só "Os meus certificados"', () => {
    role = 'COLABORADOR';
    render(<CertificatesCenter />);
    expect(screen.getByTestId('my-certificates')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  test('gestor (sem âmbito de equipa nesta fase) vê só os seus', () => {
    role = 'GESTOR';
    render(<CertificatesCenter />);
    expect(screen.getByTestId('my-certificates')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  test.each(['RH', 'ADMIN', 'AUDITOR'])('%s vê os 6 separadores', (r) => {
    role = r;
    render(<CertificatesCenter />);
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(tabs).toEqual([
      'Visão geral',
      'Certificados',
      'Modelos',
      'Regras',
      'Histórico',
      'Os meus',
    ]);
    expect(screen.getByText('overview-tab')).toBeInTheDocument();
  });
});

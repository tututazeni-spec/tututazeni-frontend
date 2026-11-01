import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CertificatesCenter } from './CertificatesCenter';

let role: string | undefined;
vi.mock('@/hooks/useCurrentRole', () => ({
  useCurrentRole: () => role,
  useHasRole: (allowed: readonly string[]) =>
    !!role && allowed.includes(role as string),
}));
vi.mock('@/components/courses/CertificatesView', () => ({
  CertificatesView: () => <div data-testid="my-certificates" />,
}));
vi.mock('./OverviewTab', () => ({
  OverviewTab: () => <div>overview-tab</div>,
}));
vi.mock('./CertificatesTab', () => ({
  CertificatesTab: () => <div>certificates-tab</div>,
}));
vi.mock('./TemplateGallery', () => ({
  TemplateGallery: ({ canEdit }: { canEdit: boolean }) => (
    <div>{canEdit ? 'templates-edit' : 'templates-read'}</div>
  ),
}));
vi.mock('./RulesTab', () => ({ RulesTab: () => <div>rules-tab</div> }));
vi.mock('./HistoryTab', () => ({ HistoryTab: () => <div>history-tab</div> }));
vi.mock('./TeamSummaryTab', () => ({
  TeamSummaryTab: ({ pickDepartment }: { pickDepartment?: boolean }) => (
    <div>{pickDepartment ? 'team-tab-department' : 'team-tab'}</div>
  ),
}));

describe('CertificatesCenter', () => {
  beforeEach(() => {
    role = undefined;
  });

  test('colaborador vê só o separador "Os meus certificados"', () => {
    role = 'COLABORADOR';
    render(<CertificatesCenter />);
    expect(screen.getByTestId('my-certificates')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Os meus certificados',
    ]);
  });

  test.each(['GESTOR', 'LIDER', 'DIRECTOR'])(
    '%s vê só "Visão da equipa", "Certificados" e "Os meus"',
    (r) => {
      role = r;
      render(<CertificatesCenter />);
      expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
        'Visão da equipa',
        'Certificados',
        'Os meus',
      ]);
      expect(screen.getByText('team-tab')).toBeInTheDocument();
    },
  );

  test('instrutor continua só com os seus certificados', () => {
    role = 'INSTRUCTOR';
    render(<CertificatesCenter />);
    expect(screen.getByTestId('my-certificates')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Os meus certificados',
    ]);
  });

  test.each(['RH', 'ADMIN', 'AUDITOR'])('%s vê os 7 separadores', (r) => {
    role = r;
    render(<CertificatesCenter />);
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(tabs).toEqual([
      'Visão geral',
      'Equipa',
      'Certificados',
      'Modelos',
      'Regras',
      'Histórico',
      'Os meus',
    ]);
    expect(screen.getByText('overview-tab')).toBeInTheDocument();
  });
});

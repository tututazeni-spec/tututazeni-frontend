import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/components/payroll/RunListView', () => ({
  RunListView: () => <div>run-list</div>,
}));
vi.mock('@/components/payroll/RunDetailView', () => ({
  RunDetailView: () => <div>run-detail</div>,
}));
vi.mock('@/components/payroll/PayslipListView', () => ({
  PayslipListView: ({ onSelect, onCreate }: any) => (
    <div>
      <button onClick={() => onSelect(3)}>open-payslip</button>
      <button onClick={onCreate}>new-payslip</button>
    </div>
  ),
}));
vi.mock('@/components/payroll/AdminPayslipDetailView', () => ({
  AdminPayslipDetailView: () => <div>payslip-detail</div>,
}));
vi.mock('@/components/payroll/CreatePayslipModal', () => ({
  CreatePayslipModal: () => <div>create-modal</div>,
}));
vi.mock('@/components/payroll/HrDashboardView', () => ({
  HrDashboardView: () => <div>hr-dashboard</div>,
}));
vi.mock('@/components/payroll/DisputesView', () => ({
  DisputesView: () => <div>disputes-view</div>,
}));

const roleRef = vi.hoisted(() => ({ role: 'ADMIN' as string | undefined }));
vi.mock('@/hooks/useCurrentRole', () => ({
  useCurrentRole: () => roleRef.role,
}));
vi.mock('@/components/payslips/ListView', () => ({
  ListView: () => <div>my-list</div>,
}));
vi.mock('@/components/payslips/DetailView', () => ({
  DetailView: () => <div>my-detail</div>,
}));
vi.mock('@/components/payslips/CompareView', () => ({
  CompareView: () => <div>compare</div>,
}));
vi.mock('@/components/payslips/SimulateView', () => ({
  SimulateView: () => <div>simulate</div>,
}));
vi.mock('@/components/payslips/AnnualView', () => ({
  AnnualView: () => <div>annual</div>,
}));
vi.mock('@/components/payslips/CompensationView', () => ({
  CompensationView: () => <div>comp</div>,
}));
vi.mock('@/components/payslips/ComponentsView', () => ({
  ComponentsView: () => <div>components-view</div>,
}));
vi.mock('@/components/payslips/CompensationsView', () => ({
  CompensationsView: () => <div>compensations-view</div>,
}));
vi.mock('@/components/payslips/CompensationDetailView', () => ({
  CompensationDetailView: () => <div>comp-detail</div>,
}));

vi.mock('@/components/payroll/OverviewView', () => ({
  OverviewView: () => <div>overview-view</div>,
}));
vi.mock('@/components/payroll/EmployeesView', () => ({
  EmployeesView: () => <div>employees-view</div>,
}));
vi.mock('@/components/payroll/DeductionsView', () => ({
  DeductionsView: () => <div>deductions-view</div>,
}));
vi.mock('@/components/payroll/PaymentsView', () => ({
  PaymentsView: () => <div>payments-view</div>,
}));
vi.mock('@/components/payroll/ClosureView', () => ({
  ClosureView: () => <div>closure-view</div>,
}));
vi.mock('@/components/payroll/ReportsView', () => ({
  ReportsView: () => <div>reports-view</div>,
}));

import PayrollPage from './page';

describe('PayrollPage tabs', () => {
  test('starts on the Visão Geral tab', () => {
    render(<PayrollPage />);
    expect(screen.getByText('overview-view')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /^Processamentos/ }));
    expect(screen.getByText('run-list')).toBeInTheDocument();
  });

  test('switches to Recibos, Dashboard and Disputas', () => {
    render(<PayrollPage />);
    fireEvent.click(
      screen.getByRole('tab', { name: /^Recibos de Vencimento/ }),
    );
    expect(screen.getByText('open-payslip')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /^Dashboard Recibos/ }));
    expect(screen.getByText('hr-dashboard')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /^Disputas/ }));
    expect(screen.getByText('disputes-view')).toBeInTheDocument();
  });

  test('opening a payslip detail hides the tab strip', () => {
    render(<PayrollPage />);
    fireEvent.click(
      screen.getByRole('tab', { name: /^Recibos de Vencimento/ }),
    );
    fireEvent.click(screen.getByText('open-payslip'));
    expect(screen.getByText('payslip-detail')).toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: /^Dashboard Recibos/ }),
    ).not.toBeInTheDocument();
  });

  test('admin also sees the merged payslips tabs', () => {
    roleRef.role = 'ADMIN';
    render(<PayrollPage />);
    fireEvent.click(screen.getByRole('tab', { name: /^Os meus recibos/ }));
    expect(screen.getByText('my-list')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /^Remunerações/ }));
    expect(screen.getByText('components-view')).toBeInTheDocument();
  });

  test('non-admin lands on own payslips and has no admin tabs', () => {
    roleRef.role = 'COLABORADOR';
    render(<PayrollPage />);
    expect(screen.getByText('my-list')).toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: /^Processamentos/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: /^Remunerações/ }),
    ).not.toBeInTheDocument();
    roleRef.role = 'ADMIN';
  });
});

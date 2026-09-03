import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/components/payroll/RunListView', () => ({ RunListView: () => <div>run-list</div> }));
vi.mock('@/components/payroll/RunDetailView', () => ({ RunDetailView: () => <div>run-detail</div> }));
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
vi.mock('@/components/payroll/CreatePayslipModal', () => ({ CreatePayslipModal: () => <div>create-modal</div> }));
vi.mock('@/components/payroll/HrDashboardView', () => ({ HrDashboardView: () => <div>hr-dashboard</div> }));
vi.mock('@/components/payroll/DisputesView', () => ({ DisputesView: () => <div>disputes-view</div> }));

import PayrollPage from './page';

describe('PayrollPage tabs', () => {
  test('starts on the Runs tab', () => {
    render(<PayrollPage />);
    expect(screen.getByText('run-list')).toBeInTheDocument();
  });

  test('switches to Recibos, Dashboard and Disputas', () => {
    render(<PayrollPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Recibos' }));
    expect(screen.getByText('open-payslip')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(screen.getByText('hr-dashboard')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Disputas' }));
    expect(screen.getByText('disputes-view')).toBeInTheDocument();
  });

  test('opening a payslip detail hides the tab strip', () => {
    render(<PayrollPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Recibos' }));
    fireEvent.click(screen.getByText('open-payslip'));
    expect(screen.getByText('payslip-detail')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dashboard' })).not.toBeInTheDocument();
  });
});

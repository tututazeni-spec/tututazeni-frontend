import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ExportMenu } from './ExportMenu';

const download = vi.fn();
vi.mock('@/components/audit/downloadAuditFile', () => ({
  downloadAuditFile: (...args: unknown[]) => download(...args),
}));
const toast = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => toast }));

describe('ExportMenu', () => {
  beforeEach(() => {
    download.mockReset();
    toast.mockReset();
  });

  test.each([
    ['Exportar CSV', 'csv'],
    ['Exportar Excel', 'xlsx'],
    ['Exportar PDF', 'pdf'],
  ])('%s pede o formato %s com os filtros activos', async (label, format) => {
    download.mockResolvedValue(undefined);
    render(<ExportMenu params={{ status: 'ACTIVE', courseId: 3 }} />);
    fireEvent.click(screen.getByRole('button', { name: label }));
    await waitFor(() => expect(download).toHaveBeenCalled());
    expect(download).toHaveBeenCalledWith(
      '/certificates/admin/export',
      { status: 'ACTIVE', courseId: 3, format },
      expect.stringContaining('certificados'),
    );
  });

  test('filtros vazios não vão no pedido', async () => {
    download.mockResolvedValue(undefined);
    render(
      <ExportMenu
        params={{ search: undefined, status: '', code: undefined }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));
    await waitFor(() => expect(download).toHaveBeenCalled());
    expect(download.mock.calls[0][1]).toEqual({ format: 'csv' });
  });

  test('mostra o erro do servidor (ex.: demasiados resultados) sem rebentar', async () => {
    download.mockRejectedValue(
      new Error('Demasiados resultados (mais de 5000).'),
    );
    render(<ExportMenu params={{}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Exportar PDF' }));
    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Demasiados resultados (mais de 5000).',
        intent: 'danger',
      }),
    );
  });

  test('desactiva os botões enquanto exporta', async () => {
    let finish: () => void = () => undefined;
    download.mockReturnValue(new Promise<void>((r) => (finish = r)));
    render(<ExportMenu params={{}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Exportar Excel' }),
      ).toBeDisabled(),
    );
    finish();
  });
});

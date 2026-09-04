import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const notify = vi.fn();

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => notify,
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalContent: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

import { ImportUsersModal } from './ImportUsersModal';

function upload(csv: string, name = 'users.csv') {
  const file = new File([csv], name, { type: 'text/csv' });
  const input = screen.getByLabelText('Ficheiro CSV') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => notify.mockReset());

describe('ImportUsersModal', () => {
  test('ficheiro válido — mostra pré-visualização e importa somando à contagem', async () => {
    const onImported = vi.fn();
    const onClose = vi.fn();
    render(
      <ImportUsersModal
        activeUsersCount={3847}
        maxUsers={5000}
        onImported={onImported}
        onClose={onClose}
      />,
    );

    upload('name,email\nAna,ana@x.com\nBeto,beto@x.com\nSemMail,,');

    await screen.findByText(/2 v[aá]lidas/i);

    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));

    expect(onImported).toHaveBeenCalledWith(3849);
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'success' }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('não ultrapassa o limite de licenças (maxUsers)', async () => {
    const onImported = vi.fn();
    render(
      <ImportUsersModal
        activeUsersCount={4999}
        maxUsers={5000}
        onImported={onImported}
        onClose={vi.fn()}
      />,
    );

    upload('email\na@x.com\nb@x.com\nc@x.com');
    await screen.findByText(/3 v[aá]lidas/i);
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));

    expect(onImported).toHaveBeenCalledWith(5000);
  });

  test('ficheiro sem coluna email — erro e botão desactivado', async () => {
    render(
      <ImportUsersModal
        activeUsersCount={10}
        maxUsers={100}
        onImported={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    upload('nome,departamento\nAna,RH');

    await screen.findByText(/coluna 'email'/i);
    expect(screen.getByRole('button', { name: 'Importar' })).toBeDisabled();
  });

  test('sem ficheiro escolhido — botão Importar desactivado', () => {
    render(
      <ImportUsersModal
        activeUsersCount={10}
        maxUsers={100}
        onImported={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Importar' })).toBeDisabled();
  });

  test('ficheiro só com cabeçalho — erro, sem importação possível', async () => {
    const onImported = vi.fn();
    render(
      <ImportUsersModal
        activeUsersCount={10}
        maxUsers={100}
        onImported={onImported}
        onClose={vi.fn()}
      />,
    );

    upload('name,email');
    await screen.findByText(/Nenhuma linha de dados/i);
    expect(screen.getByRole('button', { name: 'Importar' })).toBeDisabled();
  });
});

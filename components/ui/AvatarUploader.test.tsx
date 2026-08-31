import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const notify = vi.fn();
const setAvatar = vi.fn();
const removeAvatar = vi.fn();

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useUpdateAvatar', () => ({
  useUpdateAvatar: () => ({ setAvatar, removeAvatar, saving: false }),
}));

import { AvatarUploader } from './AvatarUploader';

beforeEach(() => {
  notify.mockClear();
  setAvatar.mockClear();
  removeAvatar.mockClear();
});

describe('AvatarUploader', () => {
  test('sem url — botão diz "Carregar foto" e não há "Remover foto"', () => {
    render(<AvatarUploader name="Ana Lopes" />);
    expect(screen.getByRole('button', { name: 'Carregar foto' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remover foto' })).not.toBeInTheDocument();
  });

  test('com url — mostra "Alterar foto" e "Remover foto"', () => {
    render(<AvatarUploader name="Ana Lopes" url="data:image/jpeg;base64,AAAA" />);
    expect(screen.getByRole('button', { name: 'Alterar foto' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remover foto' }));
    expect(removeAvatar).toHaveBeenCalledTimes(1);
  });

  test('ficheiro acima de 8 MB — toast de erro, não chama setAvatar', () => {
    render(<AvatarUploader name="Ana Lopes" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const big = new File([new Uint8Array(9 * 1024 * 1024)], 'foto.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [big] } });
    expect(setAvatar).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'danger' }),
    );
  });
});

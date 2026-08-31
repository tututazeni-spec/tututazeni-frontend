import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));

import { CourseImageField } from './CourseImageField';

beforeEach(() => notify.mockClear());

describe('CourseImageField', () => {
  test('sem valor — botão "Carregar imagem", sem "Remover imagem"', () => {
    render(<CourseImageField value={null} onChange={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Carregar imagem' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remover imagem' }),
    ).not.toBeInTheDocument();
  });

  test('com valor — mostra a pré-visualização, "Alterar" e "Remover"', () => {
    const onChange = vi.fn();
    render(
      <CourseImageField
        value="data:image/jpeg;base64,AAAA"
        onChange={onChange}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Alterar imagem' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /pré-visualização/i }),
    ).toHaveAttribute('src', 'data:image/jpeg;base64,AAAA');
    fireEvent.click(screen.getByRole('button', { name: 'Remover imagem' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  test('ficheiro acima de 8 MB — toast de erro, não chama onChange', () => {
    const onChange = vi.fn();
    render(<CourseImageField value={null} onChange={onChange} />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const big = new File([new Uint8Array(9 * 1024 * 1024)], 'capa.png', {
      type: 'image/png',
    });
    fireEvent.change(input, { target: { files: [big] } });
    expect(onChange).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'danger' }),
    );
  });
});

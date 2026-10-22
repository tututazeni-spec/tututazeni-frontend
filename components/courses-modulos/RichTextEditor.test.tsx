import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RichTextEditor } from './RichTextEditor';

describe('RichTextEditor', () => {
  test('abre texto simples antigo como parágrafos', () => {
    render(<RichTextEditor value={'Olá\n\nMundo'} onChange={() => {}} />);
    const box = screen.getByRole('textbox');
    expect(box.querySelectorAll('p')).toHaveLength(2);
    expect(box).toHaveTextContent('Olá');
  });

  test('abre HTML existente sanitizado', () => {
    render(
      <RichTextEditor
        value={'<h2>T</h2><script>x</script><p onclick="y()">a</p>'}
        onChange={() => {}}
      />,
    );
    const box = screen.getByRole('textbox');
    expect(box.querySelector('h2')).not.toBeNull();
    expect(box.querySelector('script')).toBeNull();
    expect(box.querySelector('[onclick]')).toBeNull();
  });

  test('o que se escreve sai como HTML sanitizado', () => {
    const onChange = vi.fn();
    render(<RichTextEditor value="" onChange={onChange} />);
    const box = screen.getByRole('textbox');
    box.innerHTML = '<p>novo <b>texto</b></p><img src=x onerror=alert(1)>';
    fireEvent.input(box);
    const out = onChange.mock.lastCall?.[0] as string;
    expect(out).toContain('<b>texto</b>');
    expect(out).not.toMatch(/onerror/);
  });

  test('conteúdo só com espaços/tags vazias emite string vazia', () => {
    const onChange = vi.fn();
    render(<RichTextEditor value="" onChange={onChange} />);
    const box = screen.getByRole('textbox');
    box.innerHTML = '<p><br></p>';
    fireEvent.input(box);
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  test('mostra o placeholder só enquanto está vazio', () => {
    const { rerender } = render(
      <RichTextEditor
        value=""
        onChange={() => {}}
        placeholder="Escreva aqui"
      />,
    );
    expect(screen.getByText('Escreva aqui')).toBeInTheDocument();
    const box = screen.getByRole('textbox');
    box.innerHTML = '<p>x</p>';
    fireEvent.input(box);
    rerender(
      <RichTextEditor
        value=""
        onChange={() => {}}
        placeholder="Escreva aqui"
      />,
    );
    expect(screen.queryByText('Escreva aqui')).toBeNull();
  });

  test('ligação só aceita http(s) e mailto', () => {
    const onChange = vi.fn();
    const exec = vi.fn();
    document.execCommand = exec;
    render(<RichTextEditor value="<p>a</p>" onChange={onChange} />);
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Ligação' }));
    const input = screen.getByLabelText('Endereço da ligação');
    fireEvent.change(input, { target: { value: 'javascript:alert(1)' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(exec).not.toHaveBeenCalledWith(
      'createLink',
      expect.anything(),
      expect.anything(),
    );

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Ligação' }));
    const input2 = screen.getByLabelText('Endereço da ligação');
    fireEvent.change(input2, { target: { value: 'https://innova.test' } });
    fireEvent.keyDown(input2, { key: 'Enter' });
    expect(exec).toHaveBeenCalledWith(
      'createLink',
      false,
      'https://innova.test',
    );
  });
});

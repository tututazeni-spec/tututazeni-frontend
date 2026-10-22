import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ObjectivesPicker, SUGGESTED_OBJECTIVES } from './ObjectivesPicker';

describe('ObjectivesPicker', () => {
  test('marcar uma sugestão adiciona-a à lista', () => {
    const onChange = vi.fn();
    render(<ObjectivesPicker value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(SUGGESTED_OBJECTIVES[0]));
    expect(onChange).toHaveBeenCalledWith([SUGGESTED_OBJECTIVES[0]]);
  });

  test('desmarcar remove da lista', () => {
    const onChange = vi.fn();
    render(
      <ObjectivesPicker
        value={[SUGGESTED_OBJECTIVES[0]]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText(SUGGESTED_OBJECTIVES[0]));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  test('objectivo manual — Enter adiciona, sem duplicar', () => {
    const onChange = vi.fn();
    render(<ObjectivesPicker value={['Meu objectivo']} onChange={onChange} />);
    const input = screen.getByLabelText('Novo objectivo manual');
    fireEvent.change(input, { target: { value: 'meu OBJECTIVO' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'Outro' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['Meu objectivo', 'Outro']);
  });

  test('sugestões vindas de outros módulos aparecem na lista', () => {
    render(
      <ObjectivesPicker
        value={[]}
        onChange={vi.fn()}
        extraSuggestions={['Do módulo 1']}
      />,
    );
    expect(screen.getByLabelText('Do módulo 1')).toBeInTheDocument();
  });
});

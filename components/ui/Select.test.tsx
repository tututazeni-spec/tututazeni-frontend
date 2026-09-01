import { describe, expect, test, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from './Select';

// O Radix Select usa Pointer Capture / PointerEvent / scrollIntoView, todos
// ausentes no jsdom.
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
  if (typeof window.PointerEvent === 'undefined') {
    class MockPointerEvent extends MouseEvent {
      pointerType: string;
      constructor(type: string, props: PointerEventInit = {}) {
        super(type, props);
        this.pointerType = props.pointerType ?? 'mouse';
      }
    }
    window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
  }
});

const ITEMS = [
  { value: 'JUNIOR', label: 'Júnior' },
  { value: 'SENIOR', label: 'Sênior' },
];

function open() {
  fireEvent.pointerDown(screen.getByRole('combobox'), { button: 0 });
}

describe('Select', () => {
  test('abre a lista de opções ao clicar no gatilho', () => {
    render(<Select items={ITEMS} onValueChange={vi.fn()} />);
    open();
    expect(screen.getByRole('option', { name: 'Júnior' })).toBeInTheDocument();
  });

  test('o painel da lista fica acima da camada do Modal (z-50)', () => {
    // Regressão: o Select.Content é portado para o <body>, fora do
    // Dialog. Empatar em z-index com o overlay/conteúdo do Modal (ambos
    // z-50) faz a lista abrir *por trás* do overlay — o utilizador clica
    // e "não abre nada". Tem de superar o z-50, não apenas empatar.
    render(<Select items={ITEMS} onValueChange={vi.fn()} />);
    open();
    const panel = screen.getByRole('listbox');
    const z = /z-\[(\d+)\]/.exec(panel.className);
    expect(z, `className sem z-[n]: ${panel.className}`).not.toBeNull();
    expect(Number(z![1])).toBeGreaterThan(50);
  });
});

import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { VirtualList } from './VirtualList';

const make = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: i, label: `Item ${i}` }));

function renderList(n: number, threshold?: number) {
  return render(
    <VirtualList
      items={make(n)}
      getKey={(i) => i.id}
      threshold={threshold}
      className="max-h-64"
      renderItem={(i) => <button type="button">{i.label}</button>}
    />,
  );
}

// jsdom não faz layout: o contentor de scroll mediria 0px e nenhuma linha seria
// montada. Simula-se a altura que um browser daria a um `max-h-64` (256px).
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 256,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 300,
  });
  // As linhas virtualizadas são medidas por offsetHeight (40px cada).
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute('data-index') ? 40 : 0;
    },
  });
});

describe('VirtualList', () => {
  it('abaixo do limiar renderiza todas as linhas', () => {
    renderList(50);
    expect(screen.getAllByRole('button')).toHaveLength(50);
  });

  it('acima do limiar põe só uma janela no DOM', async () => {
    renderList(6000);
    const rendered = (await screen.findAllByRole('button')).length;
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(60);
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.queryByText('Item 5999')).not.toBeInTheDocument();
  });

  it('mostra o header mesmo sem itens', () => {
    render(
      <VirtualList
        items={[]}
        getKey={() => 0}
        renderItem={() => null}
        header={<p>Sem resultados</p>}
      />,
    );
    expect(screen.getByText('Sem resultados')).toBeInTheDocument();
  });
});

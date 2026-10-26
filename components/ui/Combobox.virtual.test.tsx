import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Combobox } from './Combobox';

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

describe('Combobox com muitas opções', () => {
  it('não renderiza as 6000 opções de uma vez e filtra a lista inteira', async () => {
    const items = Array.from({ length: 6000 }, (_, i) => ({
      value: String(i),
      label: `Colaborador ${i}`,
    }));
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Combobox label="Pessoa" items={items} onValueChange={onValueChange} />,
    );

    await user.click(screen.getByRole('combobox'));
    // Radix monta um Portal: contamos botões de opção (excluindo o gatilho).
    const options = screen.getAllByRole('button', { name: /Colaborador/ });
    expect(options.length).toBeLessThan(60);

    // A pesquisa actua sobre as 6000 opções, não só sobre as visíveis.
    await user.type(
      screen.getByPlaceholderText(/filtrar/i),
      'Colaborador 5999',
    );
    await user.click(
      await screen.findByRole('button', { name: 'Colaborador 5999' }),
    );
    expect(onValueChange).toHaveBeenCalledWith('5999');
  });
});

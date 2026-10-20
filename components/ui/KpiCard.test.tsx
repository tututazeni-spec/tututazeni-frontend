import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { PillNav } from './PillTabs';
import { goToTab } from '@/lib/tabNavigation';

describe('KpiCard clicável', () => {
  it('sem destino continua a ser um card estático', () => {
    render(<KpiCard icon={Users} label="Total" value={5} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('com href é uma ligação para o módulo', () => {
    render(<KpiCard icon={Users} label="Pendentes" value={3} href="/leave" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/leave');
  });

  it('com tab salta para a aba do módulo onde está', () => {
    const onChange = vi.fn();
    render(
      <div>
        <PillNav
          items={[
            { id: 'overview', label: 'Visão geral' },
            { id: 'approvals', label: 'Aprovações' },
          ]}
          value="overview"
          onChange={onChange}
        />
        <KpiCard icon={Users} label="Pendentes" value={3} tab="approvals" />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Pendentes/ }));
    expect(onChange).toHaveBeenCalledWith('approvals');
  });

  it('com onClick chama a acção própria', () => {
    const onClick = vi.fn();
    render(<KpiCard icon={Users} label="Filtro" value={1} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('goToTab', () => {
  it('prefere o conjunto de abas mais próximo da origem', () => {
    const outer = vi.fn();
    const inner = vi.fn();
    const items = [{ id: 'x', label: 'X' }];
    render(
      <div>
        <PillNav items={items} value="" onChange={outer} label="fora" />
        <section data-testid="sec">
          <PillNav items={items} value="" onChange={inner} label="dentro" />
          <span data-testid="origem" />
        </section>
      </div>,
    );
    expect(goToTab('x', screen.getByTestId('origem'))).toBe(true);
    expect(inner).toHaveBeenCalledWith('x');
    expect(outer).not.toHaveBeenCalled();
  });

  it('devolve false se a aba não existe', () => {
    expect(goToTab('nao-existe')).toBe(false);
  });
});

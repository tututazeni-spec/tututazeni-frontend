import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

afterEach(() => {
  delete document.documentElement.dataset.theme;
  document.cookie = 'innova-theme=; max-age=0; path=/';
});

describe('ThemeToggle', () => {
  it('marca o tema do <html> como selecionado', () => {
    document.documentElement.dataset.theme = 'dark';
    render(<ThemeToggle />);
    expect(screen.getByRole('radio', { name: 'Tema escuro' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Tema claro' })).not.toBeChecked();
  });

  it('muda o atributo do <html> e grava o cookie', () => {
    document.documentElement.dataset.theme = 'light';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('radio', { name: 'Tema escuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.cookie).toContain('innova-theme=dark');
  });

  it('cai em claro quando o atributo é inválido', () => {
    document.documentElement.dataset.theme = 'xpto';
    render(<ThemeToggle />);
    expect(screen.getByRole('radio', { name: 'Tema claro' })).toBeChecked();
  });
});

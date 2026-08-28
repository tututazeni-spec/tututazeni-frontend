import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  test('não renderiza nada quando totalPages <= 1', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('mostra a janela de 5 páginas a partir da página 1 (extremo baixo)', () => {
    render(<Pagination page={1} totalPages={10} onPageChange={vi.fn()} />);
    ['1', '2', '3', '4', '5'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: '6' }),
    ).not.toBeInTheDocument();
  });

  test('mostra a janela de 5 páginas centrada numa página intermédia', () => {
    render(<Pagination page={5} totalPages={10} onPageChange={vi.fn()} />);
    ['3', '4', '5', '6', '7'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });

  test('mostra a janela de 5 páginas junto ao extremo alto', () => {
    render(<Pagination page={10} totalPages={10} onPageChange={vi.fn()} />);
    ['6', '7', '8', '9', '10'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });

  test('desactiva a seta "anterior" na página 1', () => {
    render(<Pagination page={1} totalPages={10} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '←' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '→' })).not.toBeDisabled();
  });

  test('desactiva a seta "seguinte" na última página', () => {
    render(<Pagination page={10} totalPages={10} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '→' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '←' })).not.toBeDisabled();
  });

  test('chama onPageChange com o número correcto ao clicar num botão numerado', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination page={5} totalPages={10} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    expect(onPageChange).toHaveBeenCalledWith(7);
  });

  test('chama onPageChange com page - 1 ao clicar na seta "anterior"', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination page={5} totalPages={10} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '←' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  test('chama onPageChange com page + 1 ao clicar na seta "seguinte"', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination page={5} totalPages={10} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '→' }));
    expect(onPageChange).toHaveBeenCalledWith(6);
  });
});

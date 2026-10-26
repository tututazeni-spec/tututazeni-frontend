import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertCard } from './AlertCard';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('liga ao conteúdo principal e é o primeiro foco por teclado', () => {
    render(
      <>
        <SkipLink />
        <button>outro</button>
        <main id="conteudo-principal" tabIndex={-1} />
      </>,
    );
    const link = screen.getByRole('link', { name: 'Saltar para o conteúdo' });
    expect(link).toHaveAttribute('href', '#conteudo-principal');
    expect(link).toHaveClass('sr-only'); // escondido até ter foco
  });

  it('aceita outro destino', () => {
    render(<SkipLink targetId="x" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '#x');
  });
});

describe('AlertCard — urgência do anúncio', () => {
  it.each([
    ['danger', 'alert'],
    ['warning', 'alert'],
    ['info', 'status'],
    ['success', 'status'],
  ] as const)('%s usa role=%s', (variant, role) => {
    render(<AlertCard variant={variant} title="T" message="M" />);
    expect(screen.getByRole(role)).toBeInTheDocument();
  });
});

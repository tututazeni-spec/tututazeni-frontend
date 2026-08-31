import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

const DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

describe('Avatar', () => {
  test('sem url — mostra as iniciais do nome', () => {
    render(<Avatar name="Ana Lopes" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('url data: — renderiza um <img> nativo com o src exacto (sem passar pelo next/image)', () => {
    render(<Avatar name="Ana Lopes" url={DATA_URL} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', DATA_URL);
    expect(img).toHaveAttribute('alt', 'Ana Lopes');
    // next/image marca os seus <img> com data-nimg + srcset; o ramo data: não.
    expect(img).not.toHaveAttribute('data-nimg');
    expect(img).not.toHaveAttribute('srcset');
  });

  test('url http(s) — renderiza uma imagem via next/image (data-nimg presente)', () => {
    render(<Avatar name="Ana Lopes" url="https://cdn.example/a.png" />);
    expect(screen.getByRole('img')).toHaveAttribute('data-nimg');
  });
});

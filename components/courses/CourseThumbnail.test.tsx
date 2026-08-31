import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseThumbnail } from './CourseThumbnail';

// next/image não corre em jsdom sem loader — substituímos por um <img> simples
// que expõe as props que nos interessam.
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img data-variant="next-image" src={src} alt={alt} />
  ),
}));

describe('CourseThumbnail', () => {
  test('sem src — mostra o fallback 📚', () => {
    render(<CourseThumbnail src={null} alt="Curso X" />);
    expect(screen.getByText('📚')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('data: URI — usa <img> nativo, não o next/image', () => {
    render(<CourseThumbnail src="data:image/jpeg;base64,AAAA" alt="Curso X" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,AAAA');
    expect(img).not.toHaveAttribute('data-variant', 'next-image');
  });

  test('URL normal — usa o next/image', () => {
    render(<CourseThumbnail src="https://cdn.innova.ao/x.jpg" alt="Curso X" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('data-variant', 'next-image');
    expect(img).toHaveAttribute('src', 'https://cdn.innova.ao/x.jpg');
  });

  test('fallbackClassName controla o tamanho do emoji', () => {
    render(<CourseThumbnail src={null} alt="x" fallbackClassName="text-2xl" />);
    expect(screen.getByText('📚')).toHaveClass('text-2xl');
  });
});

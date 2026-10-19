import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Mail } from 'lucide-react';
import { AdminEnrollmentCard } from './AdminEnrollmentCard';

function setup(url: string | null) {
  render(
    <AdminEnrollmentCard
      seed={1}
      title="Workshop de Inovação"
      subtitle="Mariana Fonseca Antunes"
      avatar={{ name: 'Mariana Fonseca Antunes', url }}
      status={{ label: 'Em progresso', tone: 'info' }}
      tags={['Obrigatório']}
      infos={[{ icon: Mail, text: 'mariana@innova.com' }]}
      footerLabel="RH"
      actions={<button type="button">Enviar lembrete</button>}
    />,
  );
}

describe('AdminEnrollmentCard', () => {
  test('mostra curso, estado, etiquetas, informação e rodapé', () => {
    setup(null);
    expect(
      screen.getByRole('heading', { name: 'Workshop de Inovação' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Em progresso')).toBeInTheDocument();
    expect(screen.getByText('Obrigatório')).toBeInTheDocument();
    expect(screen.getByText('mariana@innova.com')).toBeInTheDocument();
    expect(screen.getByText('RH')).toBeInTheDocument();
  });

  test('com avatar — mostra a foto do utilizador no lugar da imagem', () => {
    setup('data:image/png;base64,AAAA');
    expect(
      screen.getByRole('img', { name: 'Foto de Mariana Fonseca Antunes' }),
    ).toHaveAttribute('src', 'data:image/png;base64,AAAA');
  });

  test('sem avatar — mostra as iniciais', () => {
    setup(null);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('MA')).toBeInTheDocument();
  });
});

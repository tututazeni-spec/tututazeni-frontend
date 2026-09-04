// components/courses-learn/LessonAudioBar.test.tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonAudioBar } from './LessonAudioBar';
import type { UseLessonAudio } from '@/hooks/useLessonAudio';

const hookState = vi.fn<() => UseLessonAudio>();
vi.mock('@/hooks/useLessonAudio', () => ({
  useLessonAudio: () => hookState(),
}));

const play = vi.fn();
const pause = vi.fn();
const stop = vi.fn();

function setHook(partial: Partial<UseLessonAudio>) {
  hookState.mockReturnValue({
    state: 'idle',
    progress: 0,
    error: '',
    play,
    pause,
    stop,
    ...partial,
  });
}

beforeEach(() => {
  play.mockReset();
  pause.mockReset();
  stop.mockReset();
});

describe('LessonAudioBar', () => {
  test('estado idle: mostra "Ouvir aula" e o clique chama play()', async () => {
    setHook({ state: 'idle' });
    render(<LessonAudioBar lessonId={1} />);

    const btn = screen.getByRole('button', { name: /ouvir aula/i });
    fireEvent.click(btn);
    expect(play).toHaveBeenCalledTimes(1);
  });

  test('estado loading: botão desactivado "A gerar áudio…"', () => {
    setHook({ state: 'loading' });
    render(<LessonAudioBar lessonId={1} />);

    const btn = screen.getByRole('button', { name: /a gerar áudio/i });
    expect(btn).toBeDisabled();
  });

  test('estado playing: pausar + parar + barra de progresso', async () => {
    setHook({ state: 'playing', progress: 40 });
    render(<LessonAudioBar lessonId={1} />);

    fireEvent.click(screen.getByRole('button', { name: /pausar/i }));
    expect(pause).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /parar/i }));
    expect(stop).toHaveBeenCalled();

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '40',
    );
  });

  test('estado paused: mostra "Retomar"', () => {
    setHook({ state: 'paused', progress: 55 });
    render(<LessonAudioBar lessonId={1} />);
    expect(
      screen.getByRole('button', { name: /retomar/i }),
    ).toBeInTheDocument();
  });

  test('estado error: mostra a mensagem e "Tentar de novo" chama play()', async () => {
    setHook({ state: 'error', error: 'Leitura por voz não configurada' });
    render(<LessonAudioBar lessonId={1} />);

    expect(
      screen.getByText('Leitura por voz não configurada'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /tentar de novo/i }),
    );
    expect(play).toHaveBeenCalledTimes(1);
  });
});

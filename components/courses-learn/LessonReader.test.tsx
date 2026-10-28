import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonReader } from './LessonReader';
import type { LessonProgress } from './types';

vi.mock('@/hooks/useLessonAudio', () => ({
  useLessonAudio: () => ({
    state: 'idle',
    progress: 0,
    error: '',
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
  }),
}));

const pdfState = vi.hoisted(() => ({
  current: { status: 'ready', src: 'blob:pdf' } as
    | { status: 'none' }
    | { status: 'loading' }
    | { status: 'ready'; src: string }
    | { status: 'error'; message: string },
}));
vi.mock('./useLessonPdf', () => ({ useLessonPdf: () => pdfState.current }));
vi.mock('@/components/viewers/PdfViewer', () => ({
  PdfViewer: ({ src }: { src: string }) => (
    <div data-testid="pdfjs-viewer" data-src={src} />
  ),
}));

const base: LessonProgress = {
  id: 7,
  title: 'Lição de leitura',
  type: 'TEXT',
  seq: 1,
  durationMinutes: null,
  isFree: false,
  completed: false,
  completedAt: null,
  resumePosition: 0,
  allowDownload: false,
  contentUrl: null,
  hasFile: false,
  textContent: '<h2>Introdução</h2><p>Olá <strong>equipa</strong></p>',
  captionsUrl: null,
  transcript: null,
  liveDate: null,
  liveSessionUrl: null,
  liveInstructor: null,
  activities: [],
  resources: [],
  quizId: null,
};

function setNativePdf(value: boolean | undefined) {
  Object.defineProperty(window.navigator, 'pdfViewerEnabled', {
    value,
    configurable: true,
  });
}

function renderReader(
  lesson: Partial<LessonProgress> = {},
  props: Partial<React.ComponentProps<typeof LessonReader>> = {},
) {
  const onComplete = vi.fn();
  render(
    <LessonReader
      lesson={{ ...base, ...lesson }}
      onComplete={onComplete}
      completing={false}
      currentModule={null}
      {...props}
    />,
  );
  return { onComplete };
}

describe('LessonReader', () => {
  beforeEach(() => {
    pdfState.current = { status: 'ready', src: 'blob:pdf' };
    setNativePdf(true);
  });

  test('lição de texto mostra o HTML formatado directamente na página, sem visualizador', () => {
    renderReader();
    expect(
      screen.getByRole('heading', { name: 'Introdução' }),
    ).toBeInTheDocument();
    expect(screen.getByText('equipa').tagName).toBe('STRONG');
    expect(document.querySelector('iframe')).toBeNull();
  });

  test('texto antigo (sem tags) continua a abrir como parágrafos', () => {
    renderReader({ textContent: 'Primeira linha\nSegunda' });
    expect(screen.getByText(/Primeira linha/)).toBeInTheDocument();
  });

  test('HTML malicioso é sanitizado ao renderizar', () => {
    renderReader({
      textContent:
        '<p>seguro</p><img src=x onerror="window.__pwn=1"><script>window.__pwn=1</script>',
    });
    expect(screen.getByText('seguro')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('[onerror]')).toBeNull();
  });

  test('lição PDF abre no PDF.js na própria página (sem botão de maximizar próprio)', () => {
    renderReader({ type: 'PDF', textContent: null, hasFile: true });
    expect(screen.getByTestId('pdfjs-viewer')).toHaveAttribute(
      'data-src',
      'blob:pdf',
    );
    expect(document.querySelector('iframe')).toBeNull();
    expect(
      screen.queryByRole('link', { name: 'Abrir noutro separador' }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: /maximizar/i })).toBeNull();
  });

  test('lição de texto com PDF complementar mostra texto e PDF', () => {
    renderReader({ hasFile: true });
    expect(screen.getByText('Introdução')).toBeInTheDocument();
    expect(screen.getByText('Documento complementar')).toBeInTheDocument();
    expect(screen.getByTestId('pdfjs-viewer')).toBeInTheDocument();
  });

  test('lição PDF com texto opcional mostra o PDF e as notas', () => {
    renderReader({ type: 'PDF', hasFile: true });
    expect(screen.getByTestId('pdfjs-viewer')).toBeInTheDocument();
    expect(screen.getByText('Introdução')).toBeInTheDocument();
  });

  test('falha ao obter o PDF mostra o motivo, não um ecrã vazio', () => {
    pdfState.current = { status: 'error', message: 'Aula não acessível' };
    renderReader({ type: 'PDF', textContent: null, hasFile: true });
    expect(screen.getByRole('alert')).toHaveTextContent('Aula não acessível');
  });

  test('lição sem texto nem PDF diz que ainda não tem conteúdo', () => {
    pdfState.current = { status: 'none' };
    renderReader({ type: 'PDF', textContent: null, hasFile: false });
    expect(
      screen.getByText('Esta aula ainda não tem conteúdo.'),
    ).toBeInTheDocument();
  });

  test('"Marcar como concluída" chama onComplete; concluída fica desactivada', () => {
    const { onComplete } = renderReader();
    fireEvent.click(
      screen.getByRole('button', { name: /Marcar como concluída/ }),
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('lição já concluída não pode voltar a ser marcada', () => {
    renderReader({ completed: true });
    expect(screen.getByRole('button', { name: /Concluída/ })).toBeDisabled();
  });

  test('navegação anterior/seguinte respeita hasPrevious/hasNext', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    renderReader({}, { onPrevious, onNext, hasPrevious: false, hasNext: true });
    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Próxima/ }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

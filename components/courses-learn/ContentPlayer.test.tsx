import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentPlayer } from './ContentPlayer';
import type { LessonProgress } from './types';

// LessonAudioBar (só usado no ramo TEXT) chama useLessonAudio → fetch.
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

// PdfViewer/PptxViewer carregam pdfjs-dist/pptx-preview dinamicamente e
// fazem fetch/parsing real do ficheiro — fora de scope aqui (têm os seus
// próprios testes). Este ficheiro só verifica que o ContentPlayer os monta
// com a fonte/título certos.
vi.mock('@/components/viewers/PdfViewer', () => ({
  PdfViewer: ({ src, title }: { src: string; title: string }) => (
    <div data-testid="pdf-viewer" data-src={src} data-title={title} />
  ),
}));
vi.mock('@/components/viewers/PptxViewer', () => ({
  PptxViewer: ({ src, title }: { src: string; title: string }) => (
    <div data-testid="pptx-viewer" data-src={src} data-title={title} />
  ),
}));

const baseLesson: LessonProgress = {
  id: 1,
  title: 'Manual em PDF',
  type: 'PDF',
  seq: 1,
  durationMinutes: null,
  isFree: false,
  completed: false,
  completedAt: null,
  resumePosition: 0,
  allowDownload: false,
  contentUrl: null,
  textContent: null,
  captionsUrl: null,
  transcript: null,
  liveDate: null,
  liveSessionUrl: null,
  liveInstructor: null,
  activities: [],
  resources: [],
  quizId: null,
};

const noop = () => {};

describe('ContentPlayer — lição PDF', () => {
  beforeEach(() => {
    // jsdom não implementa object URLs
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn(
      () => 'blob:mock',
    );
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn();
  });

  test('mostra o PDF embebido quando a lição tem ficheiro', () => {
    render(
      <ContentPlayer
        lesson={{
          ...baseLesson,
          contentUrl: 'data:application/pdf;base64,JVBERi0x',
        }}
        onComplete={noop}
        completing={false}
        currentModule={null}
      />,
    );
    const viewer = screen.getByTestId('pdf-viewer');
    expect(viewer).toBeInTheDocument();
    expect(viewer).toHaveAttribute('data-title', 'Manual em PDF');
  });

  test('mostra aviso quando a lição PDF não tem ficheiro', () => {
    render(
      <ContentPlayer
        lesson={baseLesson}
        onComplete={noop}
        completing={false}
        currentModule={null}
      />,
    );
    expect(screen.queryByTestId('pdf-viewer')).not.toBeInTheDocument();
    expect(screen.getByText(/ainda não tem ficheiro/i)).toBeInTheDocument();
  });
});

describe('ContentPlayer — lição PPTX', () => {
  beforeEach(() => {
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn(
      () => 'blob:mock',
    );
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn();
  });

  test('oferece descarregar a apresentação quando tem ficheiro', () => {
    render(
      <ContentPlayer
        lesson={{
          ...baseLesson,
          title: 'Slides da aula',
          type: 'SLIDE',
          contentUrl: 'data:application/vnd.ms-powerpoint;base64,UEsDBBQ',
        }}
        onComplete={noop}
        completing={false}
        currentModule={null}
      />,
    );
    const viewer = screen.getByTestId('pptx-viewer');
    expect(viewer).toBeInTheDocument();
    expect(viewer).toHaveAttribute('data-title', 'Slides da aula');

    const link = screen.getByRole('link', {
      name: /descarregar apresentação/i,
    });
    expect(link).toHaveAttribute('download', 'Slides da aula.pptx');
  });

  test('mostra aviso quando a lição PPTX não tem ficheiro', () => {
    render(
      <ContentPlayer
        lesson={{ ...baseLesson, type: 'SLIDE' }}
        onComplete={noop}
        completing={false}
        currentModule={null}
      />,
    );
    expect(screen.queryByTestId('pptx-viewer')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /descarregar apresentação/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/ainda não tem ficheiro pptx/i),
    ).toBeInTheDocument();
  });
});

describe('ContentPlayer — controlo "Ouvir aula"', () => {
  test('lição TEXT mostra o botão "Ouvir aula"', () => {
    render(
      <ContentPlayer
        lesson={{ ...baseLesson, type: 'TEXT', title: 'Introdução' }}
        onComplete={noop}
        completing={false}
        currentModule={null}
      />,
    );
    expect(
      screen.getByRole('button', { name: /ouvir aula/i }),
    ).toBeInTheDocument();
  });

  test('lição não-TEXT não mostra o botão "Ouvir aula"', () => {
    render(
      <ContentPlayer
        lesson={{ ...baseLesson, type: 'VIDEO', title: 'Aula em vídeo' }}
        onComplete={noop}
        completing={false}
        currentModule={null}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /ouvir aula/i }),
    ).not.toBeInTheDocument();
  });

  test('lição TEXT mostra o textContent real, não um placeholder', () => {
    render(
      <ContentPlayer
        lesson={{
          ...baseLesson,
          type: 'TEXT',
          title: 'Introdução',
          textContent: 'Conteúdo real escrito pelo formador.',
        }}
        onComplete={noop}
        completing={false}
        currentModule={null}
      />,
    );
    expect(
      screen.getByText('Conteúdo real escrito pelo formador.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/conteúdo de texto da aula aqui/i),
    ).not.toBeInTheDocument();
  });
});

describe('ContentPlayer — vídeo embebido', () => {
  test('URL do YouTube gera iframe de embed', () => {
    render(
      <ContentPlayer
        lesson={{
          ...baseLesson,
          type: 'VIDEO',
          title: 'Aula em vídeo',
          contentUrl: 'https://www.youtube.com/watch?v=abc123',
        }}
        onComplete={noop}
        completing={false}
        currentModule={null}
      />,
    );
    const frame = screen.getByTitle('Aula em vídeo');
    expect(frame.tagName).toBe('IFRAME');
    expect(frame).toHaveAttribute('src', 'https://www.youtube.com/embed/abc123');
  });

  test('URL directa (não YouTube/Vimeo) usa <video> nativo', () => {
    render(
      <ContentPlayer
        lesson={{
          ...baseLesson,
          type: 'VIDEO',
          title: 'Aula em vídeo',
          contentUrl: 'https://cdn.example.com/aula.mp4',
        }}
        onComplete={noop}
        completing={false}
        currentModule={null}
      />,
    );
    expect(document.querySelector('video')).toHaveAttribute(
      'src',
      'https://cdn.example.com/aula.mp4',
    );
  });
});

describe('ContentPlayer — actividades e recursos', () => {
  test('lista actividades e recursos da aula', () => {
    render(
      <ContentPlayer
        lesson={{
          ...baseLesson,
          type: 'TEXT',
          textContent: 'texto',
          activities: [
            { id: 1, type: 'QUIZ', title: 'Quiz final', description: null, contentUrl: null, seq: 0 },
          ],
          resources: [
            { id: 1, title: 'Guia de Feedback.pdf', url: 'https://cdn.example.com/guia.pdf', fileType: 'pdf', fileSizeKb: 120 },
          ],
        }}
        onComplete={noop}
        completing={false}
        currentModule={null}
      />,
    );
    expect(screen.getByText('Quiz final')).toBeInTheDocument();
    expect(screen.getByText('Guia de Feedback.pdf')).toBeInTheDocument();
  });
});

describe('ContentPlayer — navegação anterior/próxima', () => {
  test('desactiva "Anterior" quando hasPrevious é false e chama onNext ao clicar em "Próxima"', () => {
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    render(
      <ContentPlayer
        lesson={baseLesson}
        onComplete={noop}
        completing={false}
        currentModule={null}
        onPrevious={onPrevious}
        onNext={onNext}
        hasPrevious={false}
        hasNext={true}
      />,
    );
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
    screen.getByRole('button', { name: /próxima/i }).click();
    expect(onNext).toHaveBeenCalled();
  });
});

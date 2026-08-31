import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentPlayer } from './ContentPlayer';
import type { LessonProgress } from './types';

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
    const frame = screen.getByTitle('Manual em PDF');
    expect(frame).toBeInTheDocument();
    expect(frame.tagName).toBe('IFRAME');
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
    expect(screen.queryByTitle('Manual em PDF')).not.toBeInTheDocument();
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
    expect(
      screen.queryByRole('link', { name: /descarregar apresentação/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/ainda não tem ficheiro pptx/i),
    ).toBeInTheDocument();
  });
});

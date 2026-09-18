import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizEditorModal } from './QuizEditorModal';

let queryData: unknown = null;
const post = vi.fn().mockResolvedValue({});
const put = vi.fn().mockResolvedValue({});

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: queryData, isLoading: false, error: null }),
  useApiMutation: (fn: () => Promise<unknown>, opts: { onSuccess?: () => void }) => ({
    mutate: async () => {
      await fn();
      opts.onSuccess?.();
    },
    isPending: false,
  }),
}));

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: (...args: unknown[]) => post(...args),
    put: (...args: unknown[]) => put(...args),
  },
}));

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

describe('QuizEditorModal', () => {
  beforeEach(() => {
    post.mockClear();
    put.mockClear();
  });

  test('sem quiz existente, cria com POST', async () => {
    queryData = null;
    const onClose = vi.fn();
    render(<QuizEditorModal lessonId={7} lessonTitle="Feedback" onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Avaliação de Feedback' } });
    const questionBox = screen.getByPlaceholderText('Enunciado da pergunta');
    fireEvent.change(questionBox, { target: { value: 'O que é feedback construtivo?' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar quiz/i }));

    await vi.waitFor(() => expect(post).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith(
      '/courses/lessons/7/quiz',
      expect.objectContaining({
        title: 'Avaliação de Feedback',
        questions: [expect.objectContaining({ question: 'O que é feedback construtivo?' })],
      }),
    );
    expect(put).not.toHaveBeenCalled();
  });

  test('com quiz existente, carrega os dados e actualiza com PUT', async () => {
    queryData = {
      id: 3,
      title: 'Quiz existente',
      passingScore: 80,
      maxAttempts: 1,
      timeLimitMinutes: 10,
      shuffleQuestions: false,
      shuffleAnswers: false,
      showCorrectAnswers: true,
      autoFeedback: true,
      questions: [
        {
          id: 1,
          question: '2+2?',
          type: 'MULTIPLE_CHOICE',
          options: JSON.stringify([{ text: '3', isCorrect: false }, { text: '4', isCorrect: true }]),
          correctAnswer: '4',
          points: 1,
        },
      ],
    };
    render(<QuizEditorModal lessonId={7} lessonTitle="Feedback" onClose={vi.fn()} />);

    expect(await screen.findByDisplayValue('Quiz existente')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /guardar quiz/i }));

    await vi.waitFor(() => expect(put).toHaveBeenCalled());
    expect(put).toHaveBeenCalledWith('/courses/quizzes/3', expect.objectContaining({ title: 'Quiz existente' }));
    expect(post).not.toHaveBeenCalled();
  });
});

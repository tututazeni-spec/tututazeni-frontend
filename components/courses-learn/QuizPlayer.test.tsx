import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizPlayer } from './QuizPlayer';

const quiz = {
  id: 1,
  title: 'Avaliação final',
  passingScore: 70,
  maxAttempts: 2,
  timeLimitMinutes: null,
  attemptsUsed: 0,
  attemptsRemaining: 2,
  myAttempts: [],
  questions: [
    {
      id: 10,
      question: 'Quanto é 2+2?',
      type: 'MULTIPLE_CHOICE' as const,
      points: 1,
      options: [{ text: '3' }, { text: '4' }],
    },
  ],
};

let queryData = quiz;
const post = vi.fn();

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: queryData, isLoading: false, error: null }),
  useApiMutation: (fn: () => Promise<unknown>, opts: { onSuccess?: (d: unknown) => void }) => ({
    mutate: async () => {
      const result = await fn();
      opts.onSuccess?.(result);
    },
    isPending: false,
  }),
}));

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...args: unknown[]) => post(...args) },
}));

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

describe('QuizPlayer', () => {
  test('mostra as perguntas e desactiva o submeter até todas terem resposta', () => {
    render(<QuizPlayer quizId={1} />);
    expect(screen.getByText('Quanto é 2+2?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submeter respostas/i })).toBeDisabled();
  });

  test('submete e mostra o resultado', async () => {
    post.mockResolvedValue({
      score: 100,
      passed: true,
      passingScore: 70,
      feedback: 'Aprovado',
      results: [{ questionId: 10, answer: '4', correct: true, correctAnswer: '4' }],
    });
    render(<QuizPlayer quizId={1} />);
    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByRole('button', { name: /submeter respostas/i }));
    expect(await screen.findByText(/aprovado/i)).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith('/courses/quizzes/1/submit', { answers: { '10': '4' } });
  });

  test('sem tentativas restantes, mostra aviso em vez do formulário', () => {
    queryData = { ...quiz, attemptsRemaining: 0 };
    render(<QuizPlayer quizId={1} />);
    expect(screen.getByText(/já não tens tentativas disponíveis/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submeter respostas/i })).not.toBeInTheDocument();
  });
});

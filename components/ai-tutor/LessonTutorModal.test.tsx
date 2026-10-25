// Regressão: se POST /ai-tutor/sessions falhava, o efeito que inicia a sessão
// tinha `starting` nas dependências — ao passar de true para false voltava a
// disparar o pedido, em ciclo, com um toast de erro por tentativa.

import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const post = vi.fn();
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: (...a: unknown[]) => post(...a),
    patch: vi.fn(),
  },
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  ModalContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import { LessonTutorModal } from './LessonTutorModal';

const greeting = {
  session: { id: 9 },
  greeting: 'Olá! Sou a Ísis.',
  provider: null,
};

function renderModal(open = true) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const ui = (o: boolean) => (
    <QueryClientProvider client={qc}>
      <LessonTutorModal
        courseId={1}
        lessonId={2}
        lessonTitle="Lição 2"
        open={o}
        onOpenChange={vi.fn()}
      />
    </QueryClientProvider>
  );
  const view = render(ui(open));
  return { ...view, setOpen: (o: boolean) => view.rerender(ui(o)) };
}

const settle = () => new Promise((r) => setTimeout(r, 150));

beforeEach(() => {
  // jsdom não implementa scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
  post.mockReset();
  notify.mockReset();
});

describe('LessonTutorModal — início de sessão', () => {
  test('ao abrir cria a sessão uma vez e mostra a saudação', async () => {
    post.mockResolvedValue(greeting);
    renderModal();
    expect(await screen.findByText('Olá! Sou a Ísis.')).toBeInTheDocument();
    await settle();
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/ai-tutor/sessions', {
      courseId: 1,
      lessonId: 2,
    });
  });

  test('se falhar, tenta uma só vez e oferece "Tentar novamente"', async () => {
    post.mockRejectedValue(new Error('Serviço indisponível'));
    renderModal();

    expect(
      await screen.findByRole('button', { name: 'Tentar novamente' }),
    ).toBeInTheDocument();
    await settle();
    expect(post).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  test('"Tentar novamente" repete o pedido e recupera', async () => {
    post.mockRejectedValueOnce(new Error('falhou'));
    post.mockResolvedValueOnce(greeting);
    renderModal();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Tentar novamente' }),
    );
    expect(await screen.findByText('Olá! Sou a Ísis.')).toBeInTheDocument();
    expect(post).toHaveBeenCalledTimes(2);
  });

  test('fechar e voltar a abrir inicia nova sessão', async () => {
    post.mockResolvedValue(greeting);
    const { setOpen } = renderModal();
    await screen.findByText('Olá! Sou a Ísis.');

    setOpen(false);
    setOpen(true);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
  });
});

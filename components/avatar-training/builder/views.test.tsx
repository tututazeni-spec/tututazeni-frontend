// As vistas do Construtor renderizam só com props: sem QueryClient, sem
// apiClient e sem toasts.

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AssignBoxView } from './AssignBoxView';
import { BranchEditor } from './BranchEditor';
import { FailRules } from './FailRules';
import { NewSessionView } from './NewSessionView';
import { ReinforcementEditor } from './ReinforcementEditor';
import { SessionFormView } from './SessionFormView';
import { StepEditor } from './StepEditor';
import type { AssignSessionController } from '@/hooks/useAssignSession';
import type { NewSessionController } from '@/hooks/useNewSession';
import type { SessionBuilderController } from '@/hooks/useSessionBuilder';
import type { BuilderStep } from '../types';

// FailRules lista as sessões pelo nome (useSessionList faz pedidos à API).
vi.mock('../SessionPicker', () => ({
  useSessionList: () => ({
    data: [{ id: 7, title: 'Sessão 7', program: { title: 'Programa X' } }],
  }),
}));

const as = <T,>(v: unknown) => v as T;
const btn = (name: string | RegExp) => screen.getByRole('button', { name });

const step = (key: string, over: Partial<BuilderStep> = {}): BuilderStep => ({
  key,
  title: key.toUpperCase(),
  type: 'CONTENT',
  ...over,
});

describe('StepEditor', () => {
  const props = () => ({
    index: 1,
    total: 3,
    later: [],
    earlier: [],
    onChange: vi.fn(),
    onMove: vi.fn(),
    onRemove: vi.fn(),
  });

  it('subir/descer/remover delegam; nos extremos ficam desativados', () => {
    const p = props();
    const { unmount } = render(<StepEditor step={step('b')} {...p} />);
    fireEvent.click(btn('Subir etapa'));
    fireEvent.click(btn('Descer etapa'));
    fireEvent.click(btn('Remover etapa'));
    expect(p.onMove).toHaveBeenNthCalledWith(1, -1);
    expect(p.onMove).toHaveBeenNthCalledWith(2, 1);
    expect(p.onRemove).toHaveBeenCalledTimes(1);
    unmount();

    render(<StepEditor step={step('a')} {...props()} index={0} total={3} />);
    expect((btn('Subir etapa') as HTMLButtonElement).disabled).toBe(true);
  });

  it('escrever o título e o texto produz patches pequenos', () => {
    const p = props();
    render(<StepEditor step={step('b')} {...p} />);
    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'Novo' },
    });
    expect(p.onChange).toHaveBeenCalledWith({ title: 'Novo' });
    fireEvent.change(screen.getByLabelText('Recurso aprovado (URL)'), {
      target: { value: '' },
    });
    // URL vazio volta a undefined (não grava string vazia)
    fireEvent.change(screen.getByLabelText('Recurso aprovado (URL)'), {
      target: { value: 'https://x/a.png' },
    });
    expect(p.onChange).toHaveBeenLastCalledWith({
      resourceUrl: 'https://x/a.png',
    });
  });

  it('opções: uma por linha, sem vazias, dentro da pergunta', () => {
    const p = props();
    render(
      <StepEditor
        step={step('b', {
          type: 'QUESTION',
          question: { kind: 'SINGLE', options: ['A'] },
        })}
        {...p}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Opções/), {
      target: { value: 'A\n\n B \n' },
    });
    expect(p.onChange).toHaveBeenCalledWith({
      question: { kind: 'SINGLE', options: ['A', 'B'] },
    });
  });

  it('resposta correcta vazia volta a undefined', () => {
    const p = props();
    render(
      <StepEditor
        step={step('b', {
          type: 'QUESTION',
          question: { kind: 'SHORT', correctAnswer: 'x' },
        })}
        {...p}
      />,
    );
    fireEvent.change(screen.getByLabelText('Resposta correcta'), {
      target: { value: '' },
    });
    expect(p.onChange).toHaveBeenCalledWith({
      question: { kind: 'SHORT', correctAnswer: undefined },
    });
  });

  it('só perguntas têm reforço; conteúdo não tem pergunta nem ramificações', () => {
    const q = step('b', {
      type: 'QUESTION',
      question: { kind: 'SHORT', correctAnswer: 'x' },
    });
    const { unmount } = render(<StepEditor step={q} {...props()} />);
    expect(screen.getByText('Reforço se errar (opcional)')).toBeTruthy();
    unmount();

    render(<StepEditor step={step('b')} {...props()} />);
    expect(screen.queryByLabelText('Pergunta')).toBeNull();
    expect(screen.queryByText('Reforço se errar (opcional)')).toBeNull();
  });
});

describe('BranchEditor', () => {
  const later = [{ key: 'c', title: 'Final' }];
  const q = step('b', {
    type: 'QUESTION',
    question: { kind: 'TRUE_FALSE', correctAnswer: 'Verdadeiro' },
  });

  it('não aparece sem etapas posteriores', () => {
    const { container } = render(
      <BranchEditor step={q} index={0} later={[]} onChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('não aparece sem opções nem gabarito', () => {
    const { container } = render(
      <BranchEditor
        step={step('b', { type: 'QUESTION', question: { kind: 'SHORT' } })}
        index={0}
        later={later}
        onChange={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('com gabarito mostra acertar/errar e uma linha por opção', () => {
    render(
      <BranchEditor step={q} index={0} later={later} onChange={vi.fn()} />,
    );
    expect(screen.getByText('Se acertar, ir para')).toBeTruthy();
    expect(screen.getByText('Se errar, ir para')).toBeTruthy();
    expect(screen.getByText('Se escolher «Verdadeiro», ir para')).toBeTruthy();
    expect(screen.getByText('Se escolher «Falso», ir para')).toBeTruthy();
  });
});

describe('ReinforcementEditor', () => {
  const graded = step('b', {
    type: 'QUESTION',
    question: { kind: 'SHORT', correctAnswer: 'x' },
  });

  it('sem gabarito não aparece', () => {
    const { container } = render(
      <ReinforcementEditor
        step={step('b', { type: 'QUESTION', question: { kind: 'SHORT' } })}
        index={0}
        earlier={[]}
        onChange={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('escrever a mensagem grava só a mensagem; apagá-la limpa o reforço', () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <ReinforcementEditor
        step={graded}
        index={0}
        earlier={[]}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Mensagem de reforço'), {
      target: { value: 'Reveja' },
    });
    expect(onChange).toHaveBeenCalledWith({ message: 'Reveja' });
    unmount();

    const onClear = vi.fn();
    render(
      <ReinforcementEditor
        step={{ ...graded, reinforcement: { message: 'Reveja' } }}
        index={0}
        earlier={[]}
        onChange={onClear}
      />,
    );
    fireEvent.change(screen.getByLabelText('Mensagem de reforço'), {
      target: { value: '' },
    });
    expect(onClear).toHaveBeenCalledWith(undefined);
  });

  it('«Repetir a etapa» liga com 2 repetições e mostra o campo', () => {
    const onChange = vi.fn();
    render(
      <ReinforcementEditor
        step={graded}
        index={0}
        earlier={[]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Repetir a etapa antes de avançar'));
    expect(onChange).toHaveBeenCalledWith({
      retryOnIncorrect: true,
      maxRetries: 2,
    });
  });

  it('repetições são limitadas a 5', () => {
    const onChange = vi.fn();
    render(
      <ReinforcementEditor
        step={{
          ...graded,
          reinforcement: { retryOnIncorrect: true, maxRetries: 2 },
        }}
        index={0}
        earlier={[]}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Repetições'), {
      target: { value: '99' },
    });
    expect(onChange).toHaveBeenCalledWith({
      retryOnIncorrect: true,
      maxRetries: 5,
    });
  });
});

describe('FailRules', () => {
  it('mensagem entra em onFail; apagar tudo devolve regras vazias', () => {
    const onChange = vi.fn();
    const { unmount } = render(<FailRules rules={{}} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Mensagem'), {
      target: { value: 'Reveja o módulo' },
    });
    expect(onChange).toHaveBeenCalledWith({
      onFail: { message: 'Reveja o módulo' },
    });
    unmount();

    const onClear = vi.fn();
    render(
      <FailRules rules={{ onFail: { message: 'x' } }} onChange={onClear} />,
    );
    fireEvent.change(screen.getByLabelText('Mensagem'), {
      target: { value: '' },
    });
    expect(onClear).toHaveBeenCalledWith({});
  });

  it('sessão complementar mostra o nome da sessão escolhida, não o id', () => {
    render(
      <FailRules
        rules={{ onFail: { recommendSessionId: 7 } }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText('Programa X — Sessão 7').length).toBeGreaterThan(
      0,
    );
  });
});

describe('AssignBoxView', () => {
  const make = (over: Record<string, unknown> = {}) => {
    const ctl = {
      query: '',
      setQuery: vi.fn(),
      showResults: false,
      idQuery: null,
      isSearching: false,
      results: [],
      hasResults: false,
      picked: {},
      userIds: [],
      pick: vi.fn(),
      unpick: vi.fn(),
      dueDate: '',
      setDueDate: vi.fn(),
      mandatory: true,
      setMandatory: vi.fn(),
      assign: vi.fn(),
      isAssigning: false,
      ...over,
    };
    return ctl as unknown as AssignSessionController & typeof ctl;
  };

  it('sessão por publicar avisa e bloqueia «Atribuir»', () => {
    render(
      <AssignBoxView
        ctl={make({ userIds: [1], picked: { 1: 'Ana' } })}
        published={false}
      />,
    );
    expect(screen.getByText(/ainda não está publicada/)).toBeTruthy();
    expect((btn(/Atribuir/) as HTMLButtonElement).disabled).toBe(true);
  });

  it('escolher um resultado e remover um colaborador', () => {
    const ctl = make({
      showResults: true,
      results: [{ id: 5, fullName: 'Ana Silva', email: 'ana@x.ao' }],
      hasResults: true,
      picked: { 9: 'Rui' },
      userIds: [9],
    });
    render(<AssignBoxView ctl={ctl} published />);
    fireEvent.click(btn(/Ana Silva/));
    expect(ctl.pick).toHaveBeenCalledWith(5, 'Ana Silva');
    fireEvent.click(btn('Remover Rui'));
    expect(ctl.unpick).toHaveBeenCalledWith(9);
    fireEvent.click(btn('Atribuir (1)'));
    expect(ctl.assign).toHaveBeenCalledTimes(1);
  });

  it('número digitado oferece adicionar por ID', () => {
    const ctl = make({
      showResults: true,
      idQuery: 42,
      query: '42',
    });
    render(<AssignBoxView ctl={ctl} published />);
    fireEvent.click(btn('Adicionar colaborador com ID 42'));
    expect(ctl.pick).toHaveBeenCalledWith(42, 'ID 42');
  });

  it('pesquisa sem resultados avisa', () => {
    render(
      <AssignBoxView
        ctl={make({ showResults: true, query: 'zz' })}
        published
      />,
    );
    expect(screen.getByText('Nenhum colaborador encontrado.')).toBeTruthy();
  });
});

describe('SessionFormView', () => {
  const make = (over: Record<string, unknown> = {}) => {
    const ctl = {
      session: {
        id: 1,
        status: 'DRAFT',
        version: 3,
        program: { title: 'Segurança' },
      },
      title: 'Sessão 1',
      welcome: '',
      duration: '',
      experienceType: 'GUIDED_LESSON',
      setFields: vi.fn(),
      steps: [step('a'), step('b')],
      rules: {},
      setRules: vi.fn(),
      patchStep: vi.fn(),
      moveStep: vi.fn(),
      removeStep: vi.fn(),
      addStep: vi.fn(),
      canSave: true,
      save: vi.fn(),
      isSaving: false,
      ...over,
    };
    return ctl as unknown as SessionBuilderController & typeof ctl;
  };

  it('mostra as etapas, a caixa de atribuição e grava', () => {
    const ctl = make();
    render(<SessionFormView ctl={ctl} assignBox={<div>CAIXA-ATRIBUIR</div>} />);
    expect(screen.getByText('Etapa 1 · a')).toBeTruthy();
    expect(screen.getByText('Etapa 2 · b')).toBeTruthy();
    expect(screen.getByText('CAIXA-ATRIBUIR')).toBeTruthy();
    fireEvent.click(btn('Guardar sessão'));
    expect(ctl.save).toHaveBeenCalledTimes(1);
  });

  it('«Adicionar etapa» e remover chamam o controller com o índice certo', () => {
    const ctl = make();
    render(<SessionFormView ctl={ctl} assignBox={null} />);
    fireEvent.click(btn(/Adicionar etapa/));
    expect(ctl.addStep).toHaveBeenCalledTimes(1);
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Remover etapa' })[1],
    );
    expect(ctl.removeStep).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getAllByRole('button', { name: 'Descer etapa' })[0]);
    expect(ctl.moveStep).toHaveBeenCalledWith(0, 1);
  });

  it('sem poder gravar o botão fica desativado', () => {
    render(<SessionFormView ctl={make({ canSave: false })} assignBox={null} />);
    expect((btn('Guardar sessão') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('NewSessionView', () => {
  const make = (over: Record<string, unknown> = {}) => {
    const ctl = {
      programId: undefined,
      setProgramId: vi.fn(),
      title: '',
      setTitle: vi.fn(),
      programItems: [{ value: '1', label: 'Segurança' }],
      canCreate: false,
      create: vi.fn(),
      isCreating: false,
      ...over,
    };
    return ctl as unknown as NewSessionController & typeof ctl;
  };

  it('«Criar sessão» só ativa com formação e título', () => {
    const { unmount } = render(<NewSessionView ctl={make()} />);
    expect((btn(/Criar sessão/) as HTMLButtonElement).disabled).toBe(true);
    unmount();

    const ctl = make({ canCreate: true, title: 'S1' });
    render(<NewSessionView ctl={ctl} />);
    fireEvent.click(btn(/Criar sessão/));
    expect(ctl.create).toHaveBeenCalledTimes(1);
  });
});

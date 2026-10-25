// As vistas de Formações renderizam só com props: sem QueryClient, sem
// apiClient e sem toasts.

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CheckList } from './CheckList';
import { ProgramFormView } from './ProgramFormView';
import { ProgramSheetView } from './ProgramSheetView';
import { ProgramsListView } from './ProgramsListView';
import { initialProgramForm } from './logic';
import type { ProgramFormController } from '@/hooks/useProgramForm';
import type { ProgramSheetController } from '@/hooks/useProgramSheet';
import type { ProgramsListController } from '@/hooks/useProgramsList';
import type { AvatarProgram, AvatarProgramDetail } from '../types';

const as = <T,>(v: unknown) => v as T;
const btn = (name: string | RegExp) => screen.getByRole('button', { name });

const program = (over: Partial<AvatarProgram> = {}): AvatarProgram =>
  ({
    id: 1,
    code: 'AVT-1',
    title: 'Segurança no trabalho',
    description: null,
    category: null,
    difficulty: 'BEGINNER',
    experienceType: 'GUIDED_LESSON',
    status: 'DRAFT',
    version: 1,
    durationMinutes: null,
    avatar: null,
    course: null,
    _count: { sessions: 0 },
    ...over,
  }) as AvatarProgram;

function makeList(over: Record<string, unknown> = {}) {
  const ctl = {
    isAuthor: true,
    isAdmin: false,
    manage: true,
    mode: 'manage',
    setMode: vi.fn(),
    search: '',
    setSearch: vi.fn(),
    category: '',
    setCategory: vi.fn(),
    status: 'ALL',
    setStatus: vi.fn(),
    programs: [program()],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    runAction: vi.fn(),
    ...over,
  };
  return ctl as unknown as ProgramsListController & typeof ctl;
}

describe('ProgramsListView', () => {
  it('rascunho em gestão: «Submeter a revisão» dispara a acção; não há «Publicar»', () => {
    const list = makeList();
    render(
      <ProgramsListView list={list} onCreate={vi.fn()} onOpenSheet={vi.fn()} />,
    );
    fireEvent.click(btn('Submeter a revisão'));
    expect(list.runAction).toHaveBeenCalledWith(1, 'submit-review');
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull();
  });

  it('em revisão: só ADMIN/RH vê «Publicar»', () => {
    const inReview = program({ status: 'IN_REVIEW' });
    const { unmount } = render(
      <ProgramsListView
        list={makeList({ programs: [inReview] })}
        onCreate={vi.fn()}
        onOpenSheet={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull();
    unmount();

    const admin = makeList({ programs: [inReview], isAdmin: true });
    render(
      <ProgramsListView
        list={admin}
        onCreate={vi.fn()}
        onOpenSheet={vi.fn()}
      />,
    );
    fireEvent.click(btn('Publicar'));
    expect(admin.runAction).toHaveBeenCalledWith(1, 'publish');
  });

  it('catálogo: sem botões de gestão nem «Nova formação»', () => {
    render(
      <ProgramsListView
        list={makeList({ manage: false, mode: 'catalog' })}
        onCreate={vi.fn()}
        onOpenSheet={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Arquivar' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Nova formação/ })).toBeNull();
    expect(btn('Ficha')).toBeTruthy();
  });

  it('«Ficha» e «Nova formação» chamam os callbacks', () => {
    const onCreate = vi.fn();
    const onOpenSheet = vi.fn();
    render(
      <ProgramsListView
        list={makeList()}
        onCreate={onCreate}
        onOpenSheet={onOpenSheet}
      />,
    );
    fireEvent.click(btn('Ficha'));
    expect(onOpenSheet).toHaveBeenCalledWith(1);
    fireEvent.click(btn(/Nova formação/));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('lista vazia na gestão convida a criar a primeira', () => {
    render(
      <ProgramsListView
        list={makeList({ programs: [] })}
        onCreate={vi.fn()}
        onOpenSheet={vi.fn()}
      />,
    );
    expect(screen.getByText(/Crie a primeira formação/)).toBeTruthy();
  });
});

describe('CheckList', () => {
  it('marca e desmarca devolvendo os identificadores', () => {
    const onChange = vi.fn();
    render(
      <CheckList
        legend="Departamentos"
        options={[
          { id: 1, label: 'RH' },
          { id: 2, label: 'TI' },
        ]}
        selected={[1]}
        onChange={onChange}
        emptyText="Vazio"
      />,
    );
    fireEvent.click(screen.getByLabelText('TI'));
    expect(onChange).toHaveBeenCalledWith([1, 2]);
    fireEvent.click(screen.getByLabelText('RH'));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});

describe('ProgramFormView', () => {
  function makeForm(over: Record<string, unknown> = {}) {
    const ctl = {
      form: { ...initialProgramForm(), title: 'Nova' },
      set: vi.fn(),
      changeCategory: vi.fn(),
      changeLanguage: vi.fn(),
      changeCourse: vi.fn(),
      customObjective: '',
      setCustomObjective: vi.fn(),
      addCustomObjective: vi.fn(),
      users: [],
      courseOptions: [],
      moduleOptions: [],
      deptOptions: [],
      competencyOptions: [],
      avatarItems: [],
      variantItems: [],
      durationInvalid: false,
      minScoreInvalid: false,
      canSave: true,
      save: vi.fn(),
      isSaving: false,
      ...over,
    };
    return ctl as unknown as ProgramFormController & typeof ctl;
  }

  it('criação: botão «Criar» grava; «Cancelar» fecha', () => {
    const ctl = makeForm();
    const onClose = vi.fn();
    render(<ProgramFormView ctl={ctl} onClose={onClose} />);
    expect(screen.getByText('Nova formação com avatar')).toBeTruthy();
    fireEvent.click(btn('Criar'));
    expect(ctl.save).toHaveBeenCalledTimes(1);
    fireEvent.click(btn('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('edição em revisão avisa que volta a rascunho', () => {
    render(
      <ProgramFormView
        program={
          { id: 1, status: 'IN_REVIEW', title: 'X' } as AvatarProgramDetail
        }
        ctl={makeForm()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByText('Editar uma formação em revisão devolve-a a rascunho.'),
    ).toBeTruthy();
    expect(btn('Guardar')).toBeTruthy();
  });

  it('sem título válido o botão fica desativado', () => {
    render(
      <ProgramFormView ctl={makeForm({ canSave: false })} onClose={vi.fn()} />,
    );
    expect((btn('Criar') as HTMLButtonElement).disabled).toBe(true);
  });

  it('escrever o título actualiza o formulário', () => {
    const ctl = makeForm();
    render(<ProgramFormView ctl={ctl} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'Outro' },
    });
    expect(ctl.set).toHaveBeenCalledWith({ title: 'Outro' });
  });

  it('«Adicionar» objectivo só ativa com texto', () => {
    const empty = makeForm();
    const { unmount } = render(
      <ProgramFormView ctl={empty} onClose={vi.fn()} />,
    );
    expect((btn('Adicionar') as HTMLButtonElement).disabled).toBe(true);
    unmount();

    const filled = makeForm({ customObjective: 'Reduzir acidentes' });
    render(<ProgramFormView ctl={filled} onClose={vi.fn()} />);
    fireEvent.click(btn('Adicionar'));
    expect(filled.addCustomObjective).toHaveBeenCalledTimes(1);
  });

  it('nota mínima inválida mostra o erro (certificado ligado)', () => {
    render(
      <ProgramFormView
        ctl={makeForm({
          form: {
            ...initialProgramForm(),
            title: 'X',
            certificate: true,
            minScore: '200',
          },
          minScoreInvalid: true,
        })}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Entre 0 e 100')).toBeTruthy();
  });
});

describe('ProgramSheetView', () => {
  const detail = {
    id: 1,
    code: 'AVT-1',
    title: 'Segurança',
    status: 'PUBLISHED',
    version: 2,
    description: null,
    objectives: [],
    category: 'RH',
    difficulty: 'BEGINNER',
    experienceType: 'GUIDED_LESSON',
    language: 'pt',
    durationMinutes: 30,
    avatar: null,
    course: null,
    certificateEnabled: false,
    approvedAt: null,
    sessions: [
      {
        id: 1,
        title: 'Introdução',
        position: 1,
        mandatory: true,
        assessment: null,
        knowledgeSources: [],
      },
    ],
  } as unknown as AvatarProgramDetail;

  const ctl = (over: Record<string, unknown> = {}) =>
    as<ProgramSheetController>({
      program: detail,
      error: null,
      refetch: vi.fn(),
      certification: undefined,
      links: undefined,
      ...over,
    });

  it('mostra os resumos calculados e as sessões', () => {
    render(
      <ProgramSheetView
        ctl={ctl()}
        canEdit={false}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText('AVT-1 — Segurança')).toBeTruthy();
    expect(screen.getByText('PT · 30 min')).toBeTruthy();
    expect(screen.getByText('Não emite certificado')).toBeTruthy();
    expect(screen.getByText('Ainda não aprovada')).toBeTruthy();
    expect(screen.getByText('1. Introdução · obrigatória')).toBeTruthy();
    expect(screen.getByText('Sem avaliação configurada')).toBeTruthy();
    expect(screen.getByText('Sem fontes aprovadas')).toBeTruthy();
  });

  it('«Editar» só para quem edita e se não estiver arquivada', () => {
    const onEdit = vi.fn();
    const { unmount } = render(
      <ProgramSheetView
        ctl={ctl()}
        canEdit
        onClose={vi.fn()}
        onEdit={onEdit}
      />,
    );
    fireEvent.click(btn('Editar'));
    expect(onEdit).toHaveBeenCalledWith(detail);
    unmount();

    render(
      <ProgramSheetView
        ctl={ctl({ program: { ...detail, status: 'ARCHIVED' } })}
        canEdit
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
  });

  it('elegibilidade: lista os motivos quando não elegível', () => {
    render(
      <ProgramSheetView
        ctl={ctl({
          certification: {
            enabled: true,
            eligible: false,
            reasons: ['Faltam sessões'],
          },
        })}
        canEdit={false}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText('A minha elegibilidade')).toBeTruthy();
    expect(screen.getByText('Faltam sessões')).toBeTruthy();
  });
});

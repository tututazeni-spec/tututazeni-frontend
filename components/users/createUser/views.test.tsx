// As vistas do formulário «Novo Utilizador» renderizam só com props: sem
// QueryClient, sem apiClient e sem toasts.

import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ContactSection } from './ContactSection';
import { CreateUserFormView } from './CreateUserFormView';
import { ManagerPicker } from './ManagerPicker';
import { PhotoField } from './PhotoField';
import { INITIAL_USER_FORM } from './logic';
import type { CreateUserFormController } from '@/hooks/useCreateUserForm';
import type { DirectoryUser } from '../types';

const btn = (name: string | RegExp) => screen.getByRole('button', { name });

function makeCtl(over: Record<string, unknown> = {}) {
  const ctl = {
    form: { ...INITIAL_USER_FORM },
    setField: vi.fn(),
    handle: vi.fn(() => vi.fn()),
    error: '',
    submit: vi.fn(),
    saving: false,
    photoInputRef: createRef<HTMLInputElement>(),
    photoProcessing: false,
    onPhotoChange: vi.fn(),
    openPhotoPicker: vi.fn(),
    clearPhoto: vi.fn(),
    changeEmail: vi.fn(),
    emailHint: undefined,
    emailError: undefined,
    emailTaken: false,
    emailAlternatives: [],
    selectedManager: null,
    managerSearch: '',
    setManagerSearch: vi.fn(),
    managerResults: [],
    managersLoading: false,
    pickManager: vi.fn(),
    clearManager: vi.fn(),
    departmentOptions: [],
    departmentsLoading: false,
    positionOptions: [],
    positionsLoading: false,
    unitOptions: [],
    unitsLoading: false,
    roleOptions: [],
    rolesLoading: false,
    permissionOptions: [],
    permissionsLoading: false,
    courseOptions: [],
    coursesLoading: false,
    learningPathOptions: [],
    learningPathsLoading: false,
    competencyOptions: [],
    competenciesLoading: false,
    ...over,
  };
  return ctl as unknown as CreateUserFormController & typeof ctl;
}

const person = (over: Partial<DirectoryUser> = {}) =>
  ({ id: 5, fullName: 'Rui Costa', avatarUrl: null, ...over }) as DirectoryUser;

describe('CreateUserFormView', () => {
  it('«Criar utilizador» submete; «Cancelar» volta', () => {
    const ctl = makeCtl();
    const onBack = vi.fn();
    render(<CreateUserFormView ctl={ctl} onBack={onBack} />);
    fireEvent.click(btn('Criar utilizador'));
    expect(ctl.submit).toHaveBeenCalledTimes(1);
    // há dois «Cancelar» (topo e fundo): ambos voltam
    for (const b of screen.getAllByRole('button', { name: /Cancelar/ })) {
      fireEvent.click(b);
    }
    expect(onBack).toHaveBeenCalledTimes(2);
  });

  it('mostra as seis secções e o erro', () => {
    render(
      <CreateUserFormView
        ctl={makeCtl({ error: 'Email inválido' })}
        onBack={vi.fn()}
      />,
    );
    for (const title of [
      'Dados pessoais',
      'Dados profissionais',
      'Dados de contacto',
      'Conta de acesso',
      'Academia',
      'RH',
    ]) {
      expect(screen.getByText(title)).toBeTruthy();
    }
    expect(screen.getByText('Email inválido')).toBeTruthy();
  });

  it('a guardar o botão fica desativado e mostra «A criar…»', () => {
    render(
      <CreateUserFormView ctl={makeCtl({ saving: true })} onBack={vi.fn()} />,
    );
    expect(screen.getByText('A criar…')).toBeTruthy();
  });
});

describe('ContactSection', () => {
  it('escrever o email passa pelo changeEmail (marca edição manual)', () => {
    const ctl = makeCtl();
    render(<ContactSection ctl={ctl} />);
    fireEvent.change(screen.getByLabelText('Email profissional *'), {
      target: { value: 'ana@x.ao' },
    });
    expect(ctl.changeEmail).toHaveBeenCalledWith('ana@x.ao');
  });

  it('mostra a dica do formato do tenant', () => {
    render(
      <ContactSection
        ctl={makeCtl({
          emailHint: 'Formato da organização: nome.apelido@empresa.ao',
        })}
      />,
    );
    expect(
      screen.getByText('Formato da organização: nome.apelido@empresa.ao'),
    ).toBeTruthy();
  });

  it('mostra a violação do formato (o erro tem prioridade sobre a dica)', () => {
    render(
      <ContactSection
        ctl={makeCtl({
          emailHint: 'Formato da organização: nome.apelido@empresa.ao',
          emailError: 'Domínio inválido',
        })}
      />,
    );
    expect(screen.getByText('Domínio inválido')).toBeTruthy();
  });

  it('email em uso: avisa e oferece alternativas que o preenchem', () => {
    const ctl = makeCtl({
      emailTaken: true,
      emailAlternatives: ['ana.silva2@empresa.ao'],
    });
    render(<ContactSection ctl={ctl} />);
    expect(screen.getByText('Este email já está em uso')).toBeTruthy();
    expect(
      screen.getByText('Escolha uma das alternativas livres ou edite o email.'),
    ).toBeTruthy();
    fireEvent.click(btn('ana.silva2@empresa.ao'));
    expect(ctl.changeEmail).toHaveBeenCalledWith('ana.silva2@empresa.ao');
  });

  it('email em uso sem alternativas pede para editar', () => {
    render(
      <ContactSection
        ctl={makeCtl({ emailTaken: true, emailAlternatives: [] })}
      />,
    );
    expect(
      screen.getByText('Edite o email para um que ainda não exista.'),
    ).toBeTruthy();
  });

  it('sem email em uso não há alerta', () => {
    render(<ContactSection ctl={makeCtl()} />);
    expect(screen.queryByText('Este email já está em uso')).toBeNull();
  });
});

describe('PhotoField', () => {
  const props = (over: Record<string, unknown> = {}) => ({
    avatarUrl: '',
    fullName: 'Ana',
    processing: false,
    inputRef: createRef<HTMLInputElement>(),
    onFileChange: vi.fn(),
    onOpenPicker: vi.fn(),
    onUrlChange: vi.fn(),
    onClear: vi.fn(),
    ...over,
  });

  it('sem fotografia carregada mostra o campo de URL e «Carregar»', () => {
    const p = props();
    render(<PhotoField {...p} />);
    fireEvent.change(screen.getByPlaceholderText('https://…'), {
      target: { value: 'https://x/a.jpg' },
    });
    expect(p.onUrlChange).toHaveBeenCalledTimes(1);
    fireEvent.click(btn('Carregar'));
    expect(p.onOpenPicker).toHaveBeenCalledTimes(1);
  });

  it('com fotografia carregada (data URL) mostra o estado e permite remover', () => {
    const p = props({ avatarUrl: 'data:image/jpeg;base64,AAA' });
    render(<PhotoField {...p} />);
    expect(screen.getByText('Fotografia carregada')).toBeTruthy();
    expect(screen.queryByPlaceholderText('https://…')).toBeNull();
    fireEvent.click(btn('Remover fotografia'));
    expect(p.onClear).toHaveBeenCalledTimes(1);
  });
});

describe('ManagerPicker', () => {
  const props = (over: Record<string, unknown> = {}) => ({
    selected: null,
    search: '',
    onSearch: vi.fn(),
    results: [],
    loading: false,
    onPick: vi.fn(),
    onClear: vi.fn(),
    ...over,
  });

  it('escrever pesquisa; sem texto não há lista', () => {
    const p = props();
    render(<ManagerPicker {...p} />);
    fireEvent.change(screen.getByPlaceholderText(/Pesquisar por nome/), {
      target: { value: 'ru' },
    });
    expect(p.onSearch).toHaveBeenCalledWith('ru');
    expect(screen.queryByText('Nenhum colaborador encontrado')).toBeNull();
  });

  it('resultados: escolher devolve o utilizador; sem resultados avisa', () => {
    const rui = person({ email: 'rui@x.ao' });
    const p = props({ search: 'ru', results: [rui] });
    const { unmount } = render(<ManagerPicker {...p} />);
    expect(screen.getByText('rui@x.ao')).toBeTruthy();
    fireEvent.click(btn(/Rui Costa/));
    expect(p.onPick).toHaveBeenCalledWith(rui);
    unmount();

    render(<ManagerPicker {...props({ search: 'zz' })} />);
    expect(screen.getByText('Nenhum colaborador encontrado')).toBeTruthy();
  });

  it('a pesquisar mostra o estado', () => {
    render(<ManagerPicker {...props({ search: 'r', loading: true })} />);
    expect(screen.getByText('A pesquisar…')).toBeTruthy();
  });

  it('gestor escolhido mostra o nome e permite remover', () => {
    const p = props({ selected: person() });
    render(<ManagerPicker {...p} />);
    expect(screen.getByText('Rui Costa')).toBeTruthy();
    fireEvent.click(btn('Remover gestor'));
    expect(p.onClear).toHaveBeenCalledTimes(1);
  });
});

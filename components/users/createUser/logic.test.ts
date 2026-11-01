import { describe, expect, it } from 'vitest';
import {
  INITIAL_USER_FORM,
  MAX_PHOTO_BYTES,
  buildCreateUserPayload,
  canCheckEmail,
  emailHint,
  emailViolation,
  isEmailTaken,
  isPhotoTooLarge,
  isUploadedPhoto,
  managerSubtitle,
  numOrUndefined,
  shouldApplyEmailSuggestion,
  shouldSearchManagers,
  takenEmailMessage,
  type EmailCheck,
} from './logic';
import type { DirectoryUser } from '../types';

const check = (over: Partial<EmailCheck> = {}): EmailCheck => ({
  enforced: true,
  domain: 'empresa.ao',
  mode: 'ENFORCE',
  suggestion: null,
  violations: [],
  taken: false,
  alternatives: [],
  ...over,
});

describe('valores iniciais', () => {
  it('estado RH activo, conta pendente, português e fuso de Luanda', () => {
    expect(INITIAL_USER_FORM).toMatchObject({
      hrStatus: 'ACTIVE',
      accountStatus: 'PENDING',
      language: 'pt',
      timezone: 'Africa/Luanda',
      mfaEnabled: false,
      isInstructor: false,
    });
  });
});

describe('buildCreateUserPayload', () => {
  const base = {
    ...INITIAL_USER_FORM,
    fullName: 'Ana Silva',
    email: 'ana@x.ao',
  };

  it('campos em branco vão como undefined, nunca como string vazia', () => {
    const p = buildCreateUserPayload(base, undefined);
    // employeeNumber/username são @unique no backend: "" colidiria
    expect(p.employeeNumber).toBeUndefined();
    expect(p.username).toBeUndefined();
    // a password nunca é enviada: o utilizador define-a pelo link de convite
    expect(p).not.toHaveProperty('password');
    expect(Object.values(p).filter((v) => v === '')).toEqual([]);
    expect(p).toMatchObject({
      fullName: 'Ana Silva',
      email: 'ana@x.ao',
      hrStatus: 'ACTIVE',
      accountStatus: 'PENDING',
      mfaEnabled: false,
    });
  });

  it('identificadores de listas viram números; listas vazias ficam undefined', () => {
    const p = buildCreateUserPayload(
      {
        ...base,
        unitId: '3',
        departmentId: '7',
        positionId: '',
        roleId: '2',
        courseIds: [1, 2],
        learningPathIds: [],
      },
      42,
    );
    expect(p).toMatchObject({
      unitId: 3,
      departmentId: 7,
      positionId: undefined,
      roleId: 2,
      courseIds: [1, 2],
      learningPathIds: undefined,
      competencyIds: undefined,
      additionalPermissionIds: undefined,
      managerId: 42,
    });
  });

  it('booleanos seguem sempre, mesmo a false', () => {
    const p = buildCreateUserPayload(
      { ...base, mfaEnabled: true, isInstructor: true },
      undefined,
    );
    expect(p).toMatchObject({ mfaEnabled: true, isInstructor: true });
  });

  it('numOrUndefined', () => {
    expect(numOrUndefined('')).toBeUndefined();
    expect(numOrUndefined('12')).toBe(12);
  });
});

describe('fotografia', () => {
  it('limite de 3 MB', () => {
    expect(MAX_PHOTO_BYTES).toBe(3 * 1024 * 1024);
    expect(isPhotoTooLarge(MAX_PHOTO_BYTES)).toBe(false);
    expect(isPhotoTooLarge(MAX_PHOTO_BYTES + 1)).toBe(true);
  });

  it('data URL = carregada; ligação = URL', () => {
    expect(isUploadedPhoto('data:image/jpeg;base64,AAA')).toBe(true);
    expect(isUploadedPhoto('https://x/foto.jpg')).toBe(false);
    expect(isUploadedPhoto('')).toBe(false);
  });
});

describe('verificador de email', () => {
  it('só corre com nome de 2+ caracteres', () => {
    expect(canCheckEmail('A')).toBe(false);
    expect(canCheckEmail('Ana')).toBe(true);
  });

  it('a sugestão aplica-se enquanto o email não foi editado à mão', () => {
    expect(shouldApplyEmailSuggestion('ana.silva@x.ao', false, '')).toBe(true);
    // editado à mão: nunca sobrepõe
    expect(shouldApplyEmailSuggestion('ana.silva@x.ao', true, '')).toBe(false);
    // já é o valor actual: não reaplica (evita ciclo de efeitos)
    expect(
      shouldApplyEmailSuggestion('ana.silva@x.ao', false, 'ana.silva@x.ao'),
    ).toBe(false);
    expect(shouldApplyEmailSuggestion(null, false, '')).toBe(false);
    expect(shouldApplyEmailSuggestion(undefined, false, '')).toBe(false);
  });

  it('dica só quando o formato é obrigatório e há domínio', () => {
    expect(emailHint(check())).toBe(
      'Formato da organização: nome.apelido@empresa.ao',
    );
    expect(emailHint(check({ enforced: false }))).toBeUndefined();
    expect(emailHint(check({ domain: null }))).toBeUndefined();
    expect(emailHint(undefined)).toBeUndefined();
  });

  it('a violação só aparece para o email já verificado', () => {
    const c = check({ violations: ['Domínio inválido'] });
    expect(emailViolation(c, 'ana@outro.com', 'ana@outro.com')).toBe(
      'Domínio inválido',
    );
    // espaços à volta não contam
    expect(emailViolation(c, ' ana@outro.com ', 'ana@outro.com')).toBe(
      'Domínio inválido',
    );
    // a escrever: o email actual já não é o verificado
    expect(emailViolation(c, 'ana@outro.co', 'ana@outro.com')).toBeUndefined();
    expect(
      emailViolation(check({ enforced: false, violations: ['x'] }), 'a', 'a'),
    ).toBeUndefined();
  });

  it('email em uso só conta com o formato obrigatório', () => {
    expect(isEmailTaken(check({ taken: true }))).toBe(true);
    expect(isEmailTaken(check({ taken: true, enforced: false }))).toBe(false);
    expect(isEmailTaken(undefined)).toBe(false);
  });

  it('mensagem conforme haja alternativas', () => {
    expect(takenEmailMessage(['a@x.ao'])).toBe(
      'Escolha uma das alternativas livres ou edite o email.',
    );
    expect(takenEmailMessage([])).toBe(
      'Edite o email para um que ainda não exista.',
    );
  });
});

describe('gestor directo', () => {
  const user = (over: Partial<DirectoryUser> = {}) =>
    ({ id: 1, fullName: 'Rui', ...over }) as DirectoryUser;

  it('a pesquisa só corre ao escrever e sem gestor escolhido', () => {
    expect(shouldSearchManagers(null, '')).toBe(false);
    expect(shouldSearchManagers(null, '   ')).toBe(false);
    expect(shouldSearchManagers(null, 'ru')).toBe(true);
    expect(shouldSearchManagers(user(), 'ru')).toBe(false);
  });

  it('subtítulo: departamento, senão email, senão «—»', () => {
    expect(
      managerSubtitle(
        user({ department: { name: 'RH' } as DirectoryUser['department'] }),
      ),
    ).toBe('RH');
    expect(managerSubtitle(user({ email: 'rui@x.ao' }))).toBe('rui@x.ao');
    expect(managerSubtitle(user())).toBe('—');
  });
});

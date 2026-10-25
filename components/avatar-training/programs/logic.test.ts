import { describe, expect, it } from 'vitest';
import {
  ALL,
  OTHER,
  addObjective,
  approvalSummary,
  assessmentSummary,
  avatarItems,
  buildProgramPayload,
  canSaveProgram,
  certificationSummary,
  chooseCategory,
  chooseCourse,
  chooseLanguage,
  courseSummary,
  initialProgramForm,
  isDurationInvalid,
  isMinScoreInvalid,
  languageAndDuration,
  programActions,
  programListParams,
  sessionHeading,
  shouldCheckEligibility,
  shouldLoadLinks,
  sourcesSummary,
  variantItems,
  withCurrent,
} from './logic';
import { CATEGORY_OPTIONS, VARIANT_OPTIONS } from '../constants';
import { NO_USER } from '../useUserOptions';
import type {
  AvatarProgramDetail,
  ProgramSessionSummary,
  TrainingAvatar,
} from '../types';

const detail = (over: Partial<AvatarProgramDetail> = {}) =>
  ({
    id: 1,
    title: 'Segurança',
    description: null,
    category: null,
    difficulty: 'BEGINNER',
    experienceType: 'GUIDED_LESSON',
    objectives: [],
    prerequisiteCourseIds: [],
    competencyIds: [],
    sessions: [],
    course: null,
    ...over,
  }) as unknown as AvatarProgramDetail;

describe('initialProgramForm', () => {
  it('criação: valores por omissão', () => {
    expect(initialProgramForm()).toMatchObject({
      title: '',
      difficulty: 'BEGINNER',
      experienceType: 'GUIDED_LESSON',
      language: 'pt',
      courseId: ALL,
      moduleId: ALL,
      avatarId: ALL,
      responsible: NO_USER,
      certificate: false,
      allSessions: true,
      otherCategory: false,
    });
  });

  it('edição: converte números em strings e preserva a nota 0', () => {
    const f = initialProgramForm(
      detail({
        durationMinutes: 45,
        courseId: 7,
        moduleId: 3,
        responsibleId: 9,
        certificateEnabled: true,
        certificateMinScore: 0,
        certificateRequireAllSessions: false,
      }),
    );
    expect(f).toMatchObject({
      duration: '45',
      courseId: '7',
      moduleId: '3',
      responsible: '9',
      certificate: true,
      minScore: '0',
      allSessions: false,
    });
  });

  it('categoria fora da lista abre o campo «Outra»', () => {
    expect(
      initialProgramForm(detail({ category: 'Categoria inventada' }))
        .otherCategory,
    ).toBe(true);
    expect(
      initialProgramForm(detail({ category: CATEGORY_OPTIONS[0] }))
        .otherCategory,
    ).toBe(false);
  });
});

describe('dependências entre campos', () => {
  const base = initialProgramForm();

  it('categoria: «Outra» limpa o valor e abre o campo; «Sem» fecha-o', () => {
    const other = chooseCategory({ ...base, category: 'X' }, OTHER);
    expect(other).toMatchObject({ otherCategory: true, category: '' });
    const some = chooseCategory(other, CATEGORY_OPTIONS[0]);
    expect(some).toMatchObject({
      otherCategory: false,
      category: CATEGORY_OPTIONS[0],
    });
    expect(chooseCategory(some, ALL).category).toBe('');
  });

  it('mudar o idioma limpa a variante; mudar o curso limpa o módulo', () => {
    expect(chooseLanguage({ ...base, variant: 'AO' }, 'en')).toMatchObject({
      language: 'en',
      variant: '',
    });
    expect(chooseCourse({ ...base, moduleId: '5' }, '12')).toMatchObject({
      courseId: '12',
      moduleId: ALL,
    });
  });
});

describe('objectivos e opções', () => {
  it('addObjective ignora vazios e repetidos e aparara', () => {
    expect(addObjective(['A'], '  B ')).toEqual(['A', 'B']);
    expect(addObjective(['A'], 'A')).toEqual(['A']);
    expect(addObjective(['A'], '   ')).toEqual(['A']);
  });

  it('withCurrent mantém valores gravados que já não estão na lista', () => {
    expect(withCurrent(['a', 'b'], ['b', 'z'])).toEqual(['a', 'b', 'z']);
  });

  it('variantItems mantém uma variante gravada desconhecida', () => {
    const lang = Object.keys(VARIANT_OPTIONS)[0];
    const known = VARIANT_OPTIONS[lang][0].value;
    expect(variantItems(lang, known).map((i) => i.value)).not.toContain('???');
    const items = variantItems(lang, 'legado');
    expect(items[0]).toEqual({ value: ALL, label: 'Sem variante' });
    expect(items.at(-1)).toEqual({ value: 'legado', label: 'legado' });
    expect(variantItems('xx', '')).toEqual([
      { value: ALL, label: 'Sem variante' },
    ]);
  });

  it('avatarItems: só activos/em teste (e o escolhido), com o estado no nome', () => {
    const av = (id: number, name: string, status: string) =>
      ({ id, name, status }) as unknown as TrainingAvatar;
    const items = avatarItems(
      [
        av(1, 'Ana', 'ACTIVE'),
        av(2, 'Beto', 'TESTING'),
        av(3, 'Carla', 'ARCHIVED'),
        av(4, 'Duarte', 'INACTIVE'),
      ],
      '4',
    );
    expect(items.map((i) => i.label)).toEqual([
      'Sem avatar',
      'Ana',
      'Beto (Em teste)',
      'Duarte (Inactivo)',
    ]);
  });
});

describe('validação', () => {
  it('nota mínima: inteiro entre 0 e 100', () => {
    expect(isMinScoreInvalid('')).toBe(false);
    expect(isMinScoreInvalid('0')).toBe(false);
    expect(isMinScoreInvalid('100')).toBe(false);
    expect(isMinScoreInvalid('101')).toBe(true);
    expect(isMinScoreInvalid('-1')).toBe(true);
    expect(isMinScoreInvalid('7.5')).toBe(true);
    expect(isMinScoreInvalid('abc')).toBe(true);
  });

  it('duração: inteiro entre 1 e 1440', () => {
    expect(isDurationInvalid('')).toBe(false);
    expect(isDurationInvalid('1')).toBe(false);
    expect(isDurationInvalid('1440')).toBe(false);
    expect(isDurationInvalid('0')).toBe(true);
    expect(isDurationInvalid('1441')).toBe(true);
    expect(isDurationInvalid('1.5')).toBe(true);
  });

  it('canSaveProgram exige título e valores válidos', () => {
    const f = { ...initialProgramForm(), title: 'X' };
    expect(canSaveProgram(f)).toBe(true);
    expect(canSaveProgram({ ...f, title: '  ' })).toBe(false);
    expect(canSaveProgram({ ...f, duration: '0' })).toBe(false);
    expect(canSaveProgram({ ...f, minScore: '200' })).toBe(false);
  });
});

describe('buildProgramPayload', () => {
  it('criação mínima: opcionais ficam undefined', () => {
    const p = buildProgramPayload({ ...initialProgramForm(), title: '  X ' });
    expect(p).toMatchObject({
      title: 'X',
      description: undefined,
      category: undefined,
      languageVariant: undefined,
      durationMinutes: undefined,
      courseId: undefined,
      moduleId: undefined,
      avatarId: undefined,
      responsibleId: undefined,
      certificateEnabled: false,
      certificateMinScore: undefined,
      certificateRequireAllSessions: true,
    });
  });

  it('converte os identificadores em números', () => {
    const p = buildProgramPayload({
      ...initialProgramForm(),
      title: 'X',
      duration: '30',
      courseId: '7',
      moduleId: '3',
      avatarId: '2',
      responsible: '9',
    });
    expect(p).toMatchObject({
      durationMinutes: 30,
      courseId: 7,
      moduleId: 3,
      avatarId: 2,
      responsibleId: 9,
    });
  });

  it('a nota mínima só segue com o certificado ligado (e 0 conta)', () => {
    const f = { ...initialProgramForm(), title: 'X', minScore: '0' };
    expect(buildProgramPayload(f).certificateMinScore).toBeUndefined();
    expect(
      buildProgramPayload({ ...f, certificate: true }).certificateMinScore,
    ).toBe(0);
  });
});

describe('lista', () => {
  const f = { search: '', category: '', status: ALL, manage: false };

  it('catálogo mostra sempre só o publicado', () => {
    expect(programListParams({ ...f, status: 'DRAFT' })).toEqual({
      status: 'PUBLISHED',
    });
  });

  it('gestão: estado «Todos» não filtra; pesquisa e categoria aparam', () => {
    expect(
      programListParams({
        ...f,
        manage: true,
        search: ' seg ',
        category: ' RH ',
      }),
    ).toEqual({ search: 'seg', category: 'RH' });
    expect(programListParams({ ...f, manage: true, status: 'DRAFT' })).toEqual({
      status: 'DRAFT',
    });
  });

  it('programActions por estado e perfil', () => {
    expect(programActions({ status: 'DRAFT' }, true, false)).toEqual({
      canSubmitReview: true,
      canPublish: false,
      canArchive: true,
    });
    expect(programActions({ status: 'IN_REVIEW' }, true, true)).toEqual({
      canSubmitReview: false,
      canPublish: true,
      canArchive: true,
    });
    expect(
      programActions({ status: 'IN_REVIEW' }, true, false).canPublish,
    ).toBe(false);
    expect(programActions({ status: 'ARCHIVED' }, true, true).canArchive).toBe(
      false,
    );
    expect(programActions({ status: 'DRAFT' }, false, true)).toEqual({
      canSubmitReview: false,
      canPublish: false,
      canArchive: false,
    });
  });
});

describe('ficha', () => {
  it('languageAndDuration e courseSummary', () => {
    expect(languageAndDuration(detail())).toBe('PT');
    expect(
      languageAndDuration(
        detail({ language: 'en', languageVariant: 'US', durationMinutes: 30 }),
      ),
    ).toBe('EN (US) · 30 min');
    expect(courseSummary(detail())).toBe('—');
    expect(
      courseSummary(detail({ course: { id: 1, title: 'Curso' }, moduleId: 4 })),
    ).toBe('Curso · módulo #4');
  });

  it('approvalSummary', () => {
    expect(approvalSummary(detail())).toBe('Ainda não aprovada');
    expect(
      approvalSummary(detail({ approvedAt: '2026-01-05T00:00:00Z' })),
    ).toMatch(/^Responsável em /);
  });

  it('certificationSummary', () => {
    expect(certificationSummary(detail())).toBe('Não emite certificado');
    expect(
      certificationSummary(
        detail({
          certificateEnabled: true,
          certificateMinScore: 70,
          certificateRequireAllSessions: true,
        }),
      ),
    ).toBe('Sim · nota média mínima 70 · todas as sessões obrigatórias');
    expect(certificationSummary(detail({ certificateEnabled: true }))).toBe(
      'Sim',
    );
  });

  const session = (over: Partial<ProgramSessionSummary> = {}) =>
    ({
      id: 1,
      title: 'Sessão',
      position: 2,
      mandatory: false,
      assessment: null,
      knowledgeSources: [],
      ...over,
    }) as unknown as ProgramSessionSummary;

  it('sessionHeading', () => {
    expect(sessionHeading(session())).toBe('2. Sessão');
    expect(sessionHeading(session({ mandatory: true }))).toBe(
      '2. Sessão · obrigatória',
    );
  });

  it('assessmentSummary', () => {
    expect(assessmentSummary(session())).toBe('Sem avaliação configurada');
    expect(
      assessmentSummary(
        session({
          assessment: {
            passingScore: 70,
            maxAttempts: 0,
            requireFormalAssessment: true,
          },
        }),
      ),
    ).toBe(
      'Avaliação: nota mínima 70, tentativas ilimitadas, avaliação formal',
    );
    expect(
      assessmentSummary(
        session({
          assessment: {
            passingScore: 50,
            maxAttempts: 3,
            requireFormalAssessment: false,
          },
        }),
      ),
    ).toBe('Avaliação: nota mínima 50, 3 tentativa(s)');
  });

  it('sourcesSummary usa o título, ou o tipo e o id', () => {
    expect(sourcesSummary(session())).toBe('Sem fontes aprovadas');
    const out = sourcesSummary(
      session({
        knowledgeSources: [
          { id: 1, sourceType: 'DOCUMENT', title: 'Manual' },
          { id: 2, sourceType: 'DOCUMENT', title: null },
        ] as ProgramSessionSummary['knowledgeSources'],
      }),
    );
    expect(out).toMatch(/^Fontes: Manual; .+ 2$/);
  });

  it('condições das queries opcionais', () => {
    expect(shouldCheckEligibility(undefined)).toBe(false);
    expect(
      shouldCheckEligibility({ status: 'PUBLISHED', certificateEnabled: true }),
    ).toBe(true);
    expect(
      shouldCheckEligibility({ status: 'DRAFT', certificateEnabled: true }),
    ).toBe(false);
    expect(shouldLoadLinks(true, { courseId: 4 })).toBe(true);
    expect(shouldLoadLinks(false, { courseId: 4 })).toBe(false);
    expect(shouldLoadLinks(true, { courseId: null })).toBe(false);
  });
});

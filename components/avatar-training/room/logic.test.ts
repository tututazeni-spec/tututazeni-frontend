import { describe, expect, it } from 'vitest';
import {
  assignmentAction,
  buildAdvancePayload,
  buildAnswerPayload,
  buildHelpPayload,
  buildStepText,
  certificateRequestNotice,
  certificationMessage,
  currentStepNumber,
  filterAssignments,
  findLastAvatarMessage,
  formatElapsed,
  outcomeTitle,
  questionOptions,
  resourceKind,
  roomPhase,
  scoreLine,
  shouldCheckCertification,
  speakingSuffix,
} from './logic';
import type {
  CompleteResult,
  MyAssignment,
  Room,
  RoomInteraction,
  RoomStep,
} from '../types';

const attempt = (over: Partial<Room['attempt']> = {}): Room['attempt'] => ({
  id: 1,
  status: 'IN_PROGRESS',
  currentStep: 0,
  progress: 0,
  textOnly: true,
  startedAt: '2026-01-01T10:00:00.000Z',
  pausedAt: null,
  pausedSeconds: 0,
  ...over,
});

const step = (over: Partial<RoomStep> = {}): RoomStep => ({
  key: 's1',
  title: 'Introdução',
  type: 'CONTENT',
  ...over,
});

describe('roomPhase', () => {
  it('em curso: aberta, não terminada enquanto houver etapa', () => {
    expect(roomPhase(attempt(), step())).toEqual({
      paused: false,
      open: true,
      allDone: false,
    });
  });

  it('em pausa continua aberta', () => {
    expect(roomPhase(attempt({ status: 'PAUSED' }), step())).toMatchObject({
      paused: true,
      open: true,
    });
  });

  it('sem etapa atual e aberta: só falta concluir', () => {
    expect(roomPhase(attempt(), null).allDone).toBe(true);
  });

  it('concluída ou ainda a carregar: fechada', () => {
    expect(roomPhase(attempt({ status: 'COMPLETED' }), null)).toEqual({
      paused: false,
      open: false,
      allDone: false,
    });
    expect(roomPhase(undefined, undefined).open).toBe(false);
  });
});

describe('formatElapsed', () => {
  const start = new Date('2026-01-01T10:00:00.000Z').getTime();

  it('mm:ss desde o início', () => {
    expect(formatElapsed(attempt(), start + 65_000)).toBe('01:05');
  });

  it('desconta o tempo em pausa', () => {
    expect(formatElapsed(attempt({ pausedSeconds: 30 }), start + 90_000)).toBe(
      '01:00',
    );
  });

  it('congela em pausedAt enquanto pausada', () => {
    const a = attempt({
      status: 'PAUSED',
      pausedAt: '2026-01-01T10:02:00.000Z',
    });
    expect(formatElapsed(a, start + 3_600_000)).toBe('02:00');
  });

  it('nunca é negativo', () => {
    expect(formatElapsed(attempt({ pausedSeconds: 999 }), start + 1000)).toBe(
      '00:00',
    );
  });
});

describe('etapa e conversa', () => {
  it('currentStepNumber não passa do total (nem de 1 sem etapas)', () => {
    expect(currentStepNumber(0, 5)).toBe(1);
    expect(currentStepNumber(5, 5)).toBe(5);
    expect(currentStepNumber(0, 0)).toBe(1);
  });

  it('buildStepText junta título, conteúdo e pergunta', () => {
    expect(
      buildStepText(
        step({
          content: 'Texto',
          question: { kind: 'SHORT', prompt: 'Porquê?' },
        }),
      ),
    ).toBe('Introdução. Texto. Porquê?');
    expect(buildStepText(step())).toBe('Introdução');
    expect(buildStepText(null)).toBe('');
  });

  it('findLastAvatarMessage só conta mensagens de IA com aiMessageId', () => {
    const mk = (
      id: number,
      interactionType: RoomInteraction['interactionType'],
      aiMessageId?: number,
    ): RoomInteraction => ({
      id,
      sequence: id,
      interactionType,
      stepKey: null,
      content: `m${id}`,
      metadata: aiMessageId ? { aiMessageId } : null,
      createdAt: '',
    });
    const list = [
      mk(1, 'AVATAR_MESSAGE', 11),
      mk(2, 'AVATAR_MESSAGE', 22),
      mk(3, 'AVATAR_MESSAGE'),
      mk(4, 'USER_MESSAGE', 33),
    ];
    expect(findLastAvatarMessage(list)?.id).toBe(2);
    expect(findLastAvatarMessage([])).toBeUndefined();
  });

  it('resourceKind distingue imagem, vídeo, PDF e ligação (com query string)', () => {
    expect(resourceKind('https://x/a.PNG')).toBe('image');
    expect(resourceKind('https://x/a.webp?v=2')).toBe('image');
    expect(resourceKind('https://x/a.mp4')).toBe('video');
    expect(resourceKind('https://x/a.pdf?page=2')).toBe('pdf');
    expect(resourceKind('https://x/pagina')).toBe('link');
  });

  it('questionOptions: V/F fixo, opções da pergunta, ou vazio', () => {
    const q = (kind: string, options?: string[]) =>
      step({ question: { kind, options } as unknown as RoomStep['question'] });
    expect(questionOptions(q('TRUE_FALSE'))).toEqual(['Verdadeiro', 'Falso']);
    expect(questionOptions(q('CHOICE', ['A', 'B']))).toEqual(['A', 'B']);
    expect(questionOptions(q('SHORT'))).toEqual([]);
    expect(questionOptions(step())).toEqual([]);
  });

  it('speakingSuffix', () => {
    expect(speakingSuffix(false, 'SERVER')).toBe('');
    expect(speakingSuffix(true, 'SERVER')).toBe(' · a falar (voz do servidor)');
    expect(speakingSuffix(true, 'BROWSER')).toBe(
      ' · a falar (voz do navegador)',
    );
    expect(speakingSuffix(true, null)).toBe(' · a falar (voz do navegador)');
  });
});

describe('payloads', () => {
  it('resposta e avanço', () => {
    expect(buildAnswerPayload('s1', 'Falso')).toEqual({
      interactionType: 'USER_ANSWER',
      content: 'Falso',
      stepKey: 's1',
    });
    expect(buildAdvancePayload('s1')).toEqual({
      interactionType: 'STEP_ADVANCE',
      content: 'Continuar',
      stepKey: 's1',
    });
  });

  it('pedido de ajuda usa a pergunta, ou o texto por omissão', () => {
    expect(buildHelpPayload('  Não percebi  ', 's2').content).toBe(
      'Não percebi',
    );
    expect(buildHelpPayload('   ', undefined)).toEqual({
      interactionType: 'HELP_REQUEST',
      content: 'Pedido de ajuda de um formador humano.',
      stepKey: undefined,
    });
  });
});

describe('resultado e certificação', () => {
  it('outcomeTitle', () => {
    expect(outcomeTitle(null)).toBe('Sessão concluída.');
    expect(outcomeTitle(true)).toBe('Aprovado.');
    expect(outcomeTitle(false)).toBe('Não atingiu a nota mínima.');
  });

  it('scoreLine', () => {
    expect(scoreLine({ score: null, passingScore: 70 })).toBeNull();
    expect(scoreLine({ score: 85, passingScore: null })).toBe('Nota: 85');
    expect(scoreLine({ score: 85, passingScore: 70 })).toBe(
      'Nota: 85 (mínimo 70)',
    );
    expect(scoreLine({ score: 0, passingScore: 70 })).toBe(
      'Nota: 0 (mínimo 70)',
    );
  });

  it('só consulta a elegibilidade depois de concluir sem reprovar', () => {
    const r = (passed: boolean | null) => ({ passed }) as CompleteResult;
    expect(shouldCheckCertification(null, true)).toBe(false);
    expect(shouldCheckCertification(r(false), true)).toBe(false);
    expect(shouldCheckCertification(r(true), true)).toBe(true);
    expect(shouldCheckCertification(r(null), true)).toBe(true);
    expect(shouldCheckCertification(r(true), false)).toBe(false);
  });

  it('certificationMessage', () => {
    expect(
      certificationMessage({ enabled: true, eligible: true, reasons: [] }),
    ).toMatch(/Cumpre as regras/);
    expect(
      certificationMessage({
        enabled: true,
        eligible: false,
        reasons: ['Nota média baixa', 'Faltam sessões'],
      }),
    ).toBe(
      'Certificado ainda não disponível: Nota média baixa; Faltam sessões.',
    );
  });

  it('certificateRequestNotice', () => {
    expect(
      certificateRequestNotice({ status: 'ISSUED', certificate: null }),
    ).toEqual({ title: 'Certificado emitido', description: undefined });
    expect(
      certificateRequestNotice({ status: 'REQUESTED', certificate: null }),
    ).toEqual({
      title: 'Pedido de certificado registado',
      description: 'O responsável pela formação foi avisado.',
    });
  });
});

describe('lista de sessões atribuídas', () => {
  const asg = (
    id: number,
    experienceType: string,
    status = 'ASSIGNED',
    attempts: Array<{ status: string }> = [],
  ) =>
    ({
      id,
      status,
      session: { experienceType },
      attempts,
    }) as unknown as MyAssignment;

  it('filterAssignments sem filtro devolve tudo', () => {
    const data = [asg(1, 'GUIDED_LESSON'), asg(2, 'ROLE_PLAY')];
    expect(filterAssignments(data)).toHaveLength(2);
    expect(filterAssignments(data, ['ROLE_PLAY']).map((a) => a.id)).toEqual([
      2,
    ]);
  });

  it('assignmentAction', () => {
    expect(assignmentAction(asg(1, 'T'))).toEqual({
      done: false,
      resuming: false,
      label: 'Iniciar',
    });
    expect(
      assignmentAction(asg(1, 'T', 'IN_PROGRESS', [{ status: 'PAUSED' }])),
    ).toMatchObject({ resuming: true, label: 'Retomar' });
    expect(
      assignmentAction(asg(1, 'T', 'COMPLETED', [{ status: 'COMPLETED' }])),
    ).toMatchObject({ done: true, resuming: false });
  });
});

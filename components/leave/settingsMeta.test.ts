import { describe, expect, it } from 'vitest';
import {
  changedSettings,
  parseOptionalInt,
  validateDraft,
} from './settingsMeta';
import type { LeaveSettings } from './types';

const BASE: LeaveSettings = {
  referenceYear: null,
  vacationWindowStart: null,
  vacationWindowEnd: null,
  workWeekDays: [1, 2, 3, 4, 5],
  workdayStart: '08:00',
  workdayEnd: '17:00',
  hoursPerDay: 8,
  dayCountRule: 'PER_TYPE',
  justifiedOccurrenceTypes: ['JUSTIFIED_ABSENCE', 'HEALTH_ABSENCE'],
  unjustifiedOccurrenceTypes: ['UNJUSTIFIED_ABSENCE', 'NO_SHOW'],
  carryOverEnabled: true,
  carryOverMaxDays: null,
  minNoticeDays: null,
  maxAdvanceDays: null,
  documentRequiredCategories: [],
  substituteRequiredOverDays: null,
  decisionSlaDays: 3,
  escalationAfterDays: null,
  employeeCanCancelApproved: true,
  cancelApprovedMinDaysBefore: null,
  defaultMaxAbsencePercent: 30,
  managerCanRegisterAbsences: true,
  managerCanValidateAbsences: true,
  syncAttendance: true,
  payrollFeedEnabled: true,
  notifyHrOnApproval: false,
};

describe('changedSettings', () => {
  it('rascunho igual → nada a enviar', () => {
    expect(changedSettings(BASE, { ...BASE })).toEqual({});
  });

  it('devolve só os campos alterados', () => {
    expect(
      changedSettings(BASE, { ...BASE, hoursPerDay: 7, decisionSlaDays: 5 }),
    ).toEqual({ hoursPerDay: 7, decisionSlaDays: 5 });
  });

  it('listas com os mesmos elementos noutra ordem não contam como alteração', () => {
    expect(
      changedSettings(BASE, {
        ...BASE,
        workWeekDays: [5, 4, 3, 2, 1],
        justifiedOccurrenceTypes: ['HEALTH_ABSENCE', 'JUSTIFIED_ABSENCE'],
      }),
    ).toEqual({});
  });

  it('acrescentar um dia à semana é uma alteração', () => {
    expect(
      changedSettings(BASE, { ...BASE, workWeekDays: [1, 2, 3, 4, 5, 6] }),
    ).toEqual({ workWeekDays: [1, 2, 3, 4, 5, 6] });
  });

  it('limpar um valor opcional (null) é uma alteração', () => {
    const server = { ...BASE, minNoticeDays: 5 };
    expect(changedSettings(server, { ...server, minNoticeDays: null })).toEqual(
      { minNoticeDays: null },
    );
  });
});

describe('validateDraft', () => {
  it('rascunho por omissão é válido', () => {
    expect(validateDraft(BASE)).toBeNull();
  });

  it('semana sem dias úteis', () => {
    expect(validateDraft({ ...BASE, workWeekDays: [] })).toMatch(/dia útil/);
  });

  it('período de férias incompleto', () => {
    expect(validateDraft({ ...BASE, vacationWindowStart: '06-01' })).toMatch(
      /início e o fim/,
    );
  });

  it('horário com fim antes do início', () => {
    expect(
      validateDraft({ ...BASE, workdayStart: '17:00', workdayEnd: '08:00' }),
    ).toMatch(/posterior/);
  });

  it('ocorrência justificada e injustificada em simultâneo', () => {
    expect(
      validateDraft({
        ...BASE,
        justifiedOccurrenceTypes: ['NO_SHOW'],
        unjustifiedOccurrenceTypes: ['NO_SHOW'],
      }),
    ).toMatch(/ao mesmo tempo/);
  });
});

describe('parseOptionalInt', () => {
  it('vazio → null', () => expect(parseOptionalInt('  ')).toBeNull());
  it('inteiro válido', () => expect(parseOptionalInt('7')).toBe(7));
  it('zero é válido', () => expect(parseOptionalInt('0')).toBe(0));
  it('negativos e decimais → null', () => {
    expect(parseOptionalInt('-1')).toBeNull();
    expect(parseOptionalInt('2.5')).toBeNull();
  });
});

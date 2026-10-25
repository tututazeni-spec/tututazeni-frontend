import { describe, expect, it } from 'vitest';
import {
  ATTENDANCE_VISIBLE,
  accessProfileRows,
  accessSessionRows,
  approvedIntent,
  attendanceIntent,
  careerPlanRows,
  completedIntent,
  contactRows,
  employmentRows,
  finalScoreLabel,
  gapClass,
  hasTeam,
  identificationRows,
  overdueClass,
  priorityIntent,
  qualitativeTitle,
  recentAttendance,
  regimeRows,
  sensitivityIntent,
  structureRows,
  subordinatesCount,
} from './logic';
import type {
  AccessOverview,
  AttendanceResponse,
  CareerProfile,
  User,
} from '../types';

const user = (over: Partial<User> = {}) =>
  ({
    fullName: 'Ana Silva',
    email: 'ana@x.ao',
    gender: null,
    birthDate: null,
    hireDate: null,
    exitDate: null,
    unit: null,
    department: null,
    position: null,
    ...over,
  }) as unknown as User;

const row = (rows: Array<[string, unknown]>, label: string) =>
  rows.find(([l]) => l === label)?.[1];

describe('linhas dos cartões de dados', () => {
  it('identificação: datas formatadas, género traduzido, nulos preservados', () => {
    const rows = identificationRows(
      user({ birthDate: '1990-05-17T00:00:00Z', gender: 'FEMALE', nif: '123' }),
    );
    expect(rows[0]).toEqual(['Nome completo', 'Ana Silva']);
    expect(row(rows, 'Data de nascimento')).toMatch(/1990/);
    expect(row(rows, 'Género')).toBe('Feminino');
    expect(row(rows, 'NIF')).toBe('123');
    // sem data não há «Invalid Date»: o valor fica vazio para a vista mostrar «—»
    expect(row(identificationRows(user()), 'Data de nascimento')).toBeNull();
  });

  it('contacto e vínculo', () => {
    expect(row(contactRows(user()), 'Email profissional')).toBe('ana@x.ao');
    expect(contactRows(user())).toHaveLength(7);
    const emp = employmentRows(
      user({ hireDate: '2020-01-02T00:00:00Z', exitDate: null }),
    );
    expect(row(emp, 'Data de admissão')).toMatch(/2020/);
    expect(row(emp, 'Data de saída')).toBeNull();
  });

  it('regime não inclui o estado (é um badge acrescentado pela vista)', () => {
    const labels = regimeRows(user()).map(([l]) => l);
    expect(labels).toEqual([
      'Tipo de contrato',
      'Regime de trabalho',
      'Horário',
      'Centro de custo',
    ]);
  });
});

describe('organização', () => {
  it('estrutura usa os nomes aninhados', () => {
    const rows = structureRows(
      user({
        unit: { id: 1, name: 'Luanda' },
        department: { id: 2, name: 'RH', code: 'RH' },
        position: { id: 3, name: 'Analista', level: null },
      }),
    );
    expect(rows.map(([, v]) => v)).toEqual([
      'Luanda',
      undefined,
      'RH',
      undefined,
      'Analista',
    ]);
  });

  it('equipa só para quem tem subordinados', () => {
    expect(subordinatesCount(user())).toBe(0);
    expect(hasTeam(user())).toBe(false);
    expect(
      hasTeam(user({ _count: { subordinates: 3 } as User['_count'] })),
    ).toBe(true);
  });

  it('atrasos a vermelho só se houver', () => {
    expect(overdueClass(0)).toBe('text-ink-faint');
    expect(overdueClass(2)).toBe('text-danger');
  });
});

describe('acesso', () => {
  const access = (over: Partial<AccessOverview> = {}) =>
    ({
      profile: null,
      systemFunction: 'Gestor',
      contentAccessLevel: 'ALL',
      mfaEnabled: false,
      accountCreatedAt: '2024-03-01T00:00:00Z',
      lastLoginAt: null,
      activeSessions: 2,
      ...over,
    }) as unknown as AccessOverview;

  it('MFA em português', () => {
    expect(row(accessProfileRows(access()), 'MFA')).toBe('Desactivado');
    expect(row(accessProfileRows(access({ mfaEnabled: true })), 'MFA')).toBe(
      'Activado',
    );
  });

  it('último login: «Sem registo» ou data; dados indisponíveis explicados', () => {
    expect(row(accessSessionRows(access()), 'Último login')).toBe(
      'Sem registo',
    );
    expect(
      row(
        accessSessionRows(access({ lastLoginAt: '2026-01-05T10:00:00Z' })),
        'Último login',
      ),
    ).toMatch(/2026/);
    expect(row(accessSessionRows(access()), 'Dispositivos')).toMatch(
      /Não disponível/,
    );
    expect(row(accessSessionRows(access()), 'Sessões activas')).toBe(2);
  });
});

describe('intenção dos badges', () => {
  it('concluído/aprovado = verde; o resto informativo', () => {
    expect(completedIntent('COMPLETED')).toBe('success');
    expect(completedIntent('IN_PROGRESS')).toBe('info');
    expect(approvedIntent('APPROVED')).toBe('success');
    expect(approvedIntent('PENDING')).toBe('info');
  });

  it('prioridade e sensibilidade', () => {
    expect(priorityIntent('HIGH')).toBe('danger');
    expect(priorityIntent('LOW')).toBe('neutral');
    expect(sensitivityIntent('CONFIDENTIAL')).toBe('warning');
    expect(sensitivityIntent('PUBLIC')).toBe('neutral');
  });

  it('presença: presente verde, ausente vermelho, outros (atraso…) amarelo', () => {
    expect(attendanceIntent('PRESENT')).toBe('success');
    expect(attendanceIntent('ABSENT')).toBe('danger');
    expect(attendanceIntent('LATE')).toBe('warning');
  });
});

describe('competências e desempenho', () => {
  it('gapClass: lacuna positiva a vermelho', () => {
    expect(gapClass(2)).toBe('text-danger');
    expect(gapClass(0)).toBe('text-success');
    expect(gapClass(-1)).toBe('text-success');
    expect(gapClass(null)).toBe('text-success');
    expect(gapClass(undefined)).toBe('text-success');
  });

  it('qualitativo', () => {
    expect(qualitativeTitle('strengths')).toBe('Pontos fortes');
    expect(qualitativeTitle('improvements')).toBe('A melhorar');
    expect(qualitativeTitle('recommendations')).toBe('Recomendações');
  });

  it('finalScoreLabel: a nota 0 é válida; null explica a falta de permissão', () => {
    expect(finalScoreLabel(0)).toBe(0);
    expect(finalScoreLabel(4.5)).toBe(4.5);
    expect(finalScoreLabel(null)).toBe('— (sem permissão para ver)');
  });
});

describe('carreira e presenças', () => {
  it('careerPlanRows', () => {
    expect(
      careerPlanRows({ careerPlan: null } as unknown as CareerProfile),
    ).toEqual([
      ['Estado', 'Sem plano activo'],
      ['Objectivos', 0],
    ]);
    expect(
      careerPlanRows({
        careerPlan: { status: 'ACTIVE', goals: [1, 2] },
      } as unknown as CareerProfile),
    ).toEqual([
      ['Estado', 'ACTIVE'],
      ['Objectivos', 2],
    ]);
  });

  it('recentAttendance limita aos 30 mais recentes', () => {
    const records = Array.from({ length: 45 }, (_, i) => ({
      id: i,
    })) as unknown as AttendanceResponse['records'];
    expect(ATTENDANCE_VISIBLE).toBe(30);
    expect(recentAttendance(records)).toHaveLength(30);
    expect(recentAttendance(records.slice(0, 5))).toHaveLength(5);
  });
});

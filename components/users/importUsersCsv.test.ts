import { describe, expect, test } from 'vitest';
import { guessMapping, mapRows, parseCsv } from './importUsersCsv';

describe('parseCsv', () => {
  test('separa cabeçalho e linhas de dados, ignorando linhas em branco', () => {
    const csv = ['email,nome', '', 'ana@x.com,Ana', 'beto@x.com,Beto'].join('\n');
    const r = parseCsv(csv);
    expect(r.error).toBeUndefined();
    expect(r.headers).toEqual(['email', 'nome']);
    expect(r.rows).toEqual([
      ['ana@x.com', 'Ana'],
      ['beto@x.com', 'Beto'],
    ]);
  });

  test('erro quando o ficheiro está vazio', () => {
    expect(parseCsv('   \n  \n').error).toMatch(/vazio/);
  });

  test('erro quando só tem cabeçalho', () => {
    expect(parseCsv('email,nome').error).toMatch(/Nenhuma linha de dados/);
  });
});

describe('guessMapping', () => {
  test('reconhece cabeçalhos em português e inglês, indiferente a maiúsculas', () => {
    expect(guessMapping(['Email', 'Nome Completo', 'Departamento', 'Coluna Aleatória'])).toEqual([
      'email',
      'fullName',
      'departmentName',
      'ignore',
    ]);
  });
});

describe('mapRows', () => {
  test('aplica o mapeamento e marca linhas sem email/nome como inválidas', () => {
    const rows = [
      ['ana@x.com', 'Ana', 'TI'],
      ['', 'Sem Email', 'RH'],
    ];
    const mapping = ['email', 'fullName', 'departmentName'] as const;
    const mapped = mapRows(rows, [...mapping]);

    expect(mapped[0]).toMatchObject({
      line: 1,
      email: 'ana@x.com',
      fullName: 'Ana',
      departmentName: 'TI',
      missingRequired: false,
    });
    expect(mapped[1].missingRequired).toBe(true);
  });

  test('colunas mapeadas para "ignore" não aparecem no resultado', () => {
    const rows = [['ana@x.com', 'Ana', 'valor qualquer']];
    const mapped = mapRows(rows, ['email', 'fullName', 'ignore']);
    expect(mapped[0].employeeNumber).toBeUndefined();
  });
});

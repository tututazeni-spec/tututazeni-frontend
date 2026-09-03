import { describe, expect, test } from 'vitest';
import { parseUsersCsv } from './importUsersCsv';

describe('parseUsersCsv', () => {
  test('conta linhas de dados e classifica emails válidos/inválidos', () => {
    const csv = [
      'name,email,department',
      'Ana Silva,ana@innova.com,RH',
      'Beto Costa,beto@innova.com,TI',
      'Sem Email,,Ops',
      'Email Marado,nope,Ops',
    ].join('\n');

    const r = parseUsersCsv(csv);
    expect(r.error).toBeUndefined();
    expect(r.totalRows).toBe(4);
    expect(r.validRows).toBe(2);
    expect(r.invalidRows).toBe(2);
    expect(r.headers).toEqual(['name', 'email', 'department']);
  });

  test('ignora linhas em branco e espaços à volta das células', () => {
    const csv = 'email , nome\n  ana@x.com , Ana \n\n  beto@x.com ,Beto\n';
    const r = parseUsersCsv(csv);
    expect(r.totalRows).toBe(2);
    expect(r.validRows).toBe(2);
  });

  test('aceita cabeçalho "e-mail" e é indiferente a maiúsculas', () => {
    const csv = 'Nome,E-Mail\nAna,ana@x.com';
    const r = parseUsersCsv(csv);
    expect(r.error).toBeUndefined();
    expect(r.validRows).toBe(1);
  });

  test('erro quando não há coluna de email', () => {
    const r = parseUsersCsv('nome,departamento\nAna,RH');
    expect(r.error).toMatch(/coluna 'email'/);
    expect(r.validRows).toBe(0);
  });

  test('erro quando só tem cabeçalho', () => {
    const r = parseUsersCsv('name,email');
    expect(r.error).toMatch(/Nenhuma linha de dados/);
  });

  test('erro quando o ficheiro está vazio', () => {
    expect(parseUsersCsv('   \n  \n').error).toMatch(/vazio/);
  });
});

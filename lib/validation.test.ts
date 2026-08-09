// lib/validation.test.ts
// Cobre a validação de formulário que estava duplicada como
// `if (!form.x || !form.y) setError('Preencha os campos obrigatórios')`
// em ~9 formulários — sem validação de formato (email) e, nalguns casos
// (users.tsx), sem sequer mostrar um erro ao utilizador quando falhava.
// Ver memory project_innova_component_separation_audit.

import { describe, expect, test } from 'vitest';
import { email, firstError, required, validate } from './validation';

describe('required', () => {
  test('rejeita string vazia', () => {
    expect(required()('')).toBe('Campo obrigatório');
  });

  test('rejeita string só com espaços', () => {
    expect(required()('   ')).toBe('Campo obrigatório');
  });

  test('rejeita undefined e null', () => {
    expect(required()(undefined)).toBe('Campo obrigatório');
    expect(required()(null)).toBe('Campo obrigatório');
  });

  test('aceita um valor preenchido', () => {
    expect(required()('Ana')).toBeUndefined();
  });

  test('permite mensagem personalizada', () => {
    expect(required('Nome é obrigatório')('')).toBe('Nome é obrigatório');
  });
});

describe('email', () => {
  test('aceita um email bem formado', () => {
    expect(email()('ana@empresa.com')).toBeUndefined();
  });

  test('rejeita um email sem @', () => {
    expect(email()('ana.empresa.com')).toBe('Email inválido');
  });

  test('rejeita um email sem domínio', () => {
    expect(email()('ana@')).toBe('Email inválido');
  });

  test('não valida formato de campo vazio (usar required() em conjunto se obrigatório)', () => {
    expect(email()('')).toBeUndefined();
  });
});

describe('validate', () => {
  test('devolve objecto vazio quando tudo é válido', () => {
    const errors = validate(
      { name: 'Ana', email: 'ana@empresa.com' },
      { name: [required()], email: [required(), email()] },
    );
    expect(errors).toEqual({});
  });

  test('reporta um erro por campo inválido', () => {
    const errors = validate(
      { name: '', email: 'invalido' },
      { name: [required()], email: [required(), email()] },
    );
    expect(errors).toEqual({
      name: 'Campo obrigatório',
      email: 'Email inválido',
    });
  });

  test('pára no primeiro validador que falhar por campo', () => {
    const errors = validate(
      { email: '' },
      { email: [required('Email obrigatório'), email()] },
    );
    expect(errors).toEqual({ email: 'Email obrigatório' });
  });

  test('ignora campos sem validadores no schema', () => {
    const errors = validate({ name: '', notes: '' }, { name: [required()] });
    expect(errors).toEqual({ name: 'Campo obrigatório' });
  });
});

describe('firstError', () => {
  test('devolve a primeira mensagem de erro encontrada', () => {
    expect(
      firstError({ name: 'Campo obrigatório', email: 'Email inválido' }),
    ).toBe('Campo obrigatório');
  });

  test('devolve undefined quando não há erros', () => {
    expect(firstError({})).toBeUndefined();
  });
});

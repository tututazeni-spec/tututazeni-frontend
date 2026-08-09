// lib/validation.ts
// Validação de formulário partilhada — antes desta extracção, ~9 formulários
// repetiam `if (!form.x || !form.y) setError('Preencha os campos
// obrigatórios')`: uma única mensagem genérica, sem validação de formato
// (ex: email), e nalguns casos (users.tsx) sem sequer mostrar um erro ao
// utilizador quando a submissão falhava silenciosamente.
// Ver memory project_innova_component_separation_audit.

export type Validator = (value: unknown) => string | undefined;

/** Rejeita undefined/null/string vazia (ou só espaços). */
export function required(message = 'Campo obrigatório'): Validator {
  return (value) => {
    if (value === undefined || value === null) return message;
    if (typeof value === 'string' && value.trim() === '') return message;
    return undefined;
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida o formato de email. Campo vazio passa — combinar com required() se obrigatório. */
export function email(message = 'Email inválido'): Validator {
  return (value) => {
    if (!value) return undefined;
    return EMAIL_RE.test(String(value)) ? undefined : message;
  };
}

export type Schema<T> = Partial<Record<keyof T, Validator[]>>;

/** Corre os validadores de cada campo do schema; pára no primeiro erro por campo. */
export function validate<T extends Record<string, unknown>>(
  values: T,
  schema: Schema<T>,
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const key of Object.keys(schema) as (keyof T)[]) {
    const validators = schema[key] ?? [];
    for (const validator of validators) {
      const message = validator(values[key]);
      if (message) {
        errors[key] = message;
        break;
      }
    }
  }
  return errors;
}

/** Primeira mensagem de erro encontrada — para o banner genérico no topo do formulário. */
export function firstError(
  errors: Partial<Record<string, string>>,
): string | undefined {
  return Object.values(errors).find((m): m is string => Boolean(m));
}

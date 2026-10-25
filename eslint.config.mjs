import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import reactCompiler from 'eslint-plugin-react-compiler';
import designTokens from './eslint-rules/design-tokens.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    // FlatCompat não herda os ignores por omissão do eslint-config-next
    // (ex: .next/) — sem isto, um `.next/` deixado por um build anterior faz
    // o lint varrer os .ts auto-gerados em .next/types/ e rebentar com
    // milhares de erros que nada têm a ver com o código-fonte.
    ignores: ['.next/**'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      // React Compiler (ligado em next.config.ts desde a Fase 1 do
      // perf/react-compiler) memoiza automaticamente no build, mas salta
      // silenciosamente componentes que violam as Regras do React — sem
      // esta regra não há forma de saber quais. `warn` (não `error`): só
      // visibilidade, não bloqueia build/CI.
      'react-compiler/react-compiler': 'warn',
      // HTML dinâmico só via <SafeHtml> (components/ui/SafeHtml.tsx), que sanitiza com DOMPurify.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            'Use <SafeHtml html={...} /> (components/ui/SafeHtml) em vez de dangerouslySetInnerHTML.',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // Sub-projecto 5 do audit de type-safety: o código já usa quase
      // exclusivamente `interface` para formas de objecto (confirmado —
      // só havia 2 excepções em todo o repo, uma delas um falso positivo
      // de union). Esta regra torna essa convenção obrigatória daqui em
      // diante; `type` continua livre para uniões, tuplos, mapped types,
      // etc. (a regra só actua sobre `type X = { ... }`).
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  },
  {
    // Design system (regras 1-4 da Fase 1): classes fora dos tokens e
    // elementos nativos que têm componente partilhado. `warn` — só visibilidade,
    // os módulos antigos migram aos poucos. components/ui/ é onde os
    // primitivos vivem, por isso fica de fora.
    files: ['app/**/*.tsx', 'components/**/*.tsx'],
    ignores: ['components/ui/**', '**/*.test.tsx'],
    plugins: { design: designTokens },
    rules: {
      'design/tokens-only': 'warn',
      'react/forbid-elements': [
        'warn',
        {
          forbid: [
            {
              element: 'button',
              message: 'Use <Button> / <IconButton> de components/ui/Button.',
            },
            {
              element: 'input',
              message: 'Use <Input> de components/ui/Input.',
            },
            {
              element: 'select',
              message: 'Use <Select> de components/ui/Select.',
            },
            {
              element: 'textarea',
              message: 'Use <Textarea> de components/ui/Textarea.',
            },
          ],
        },
      ],
    },
  },
  {
    // Mocks de teste precisam de `any` para simular contratos parciais.
    files: ['**/*.test.ts', '**/*.test.tsx', 'vitest.setup.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    // Único ficheiro autorizado a usar dangerouslySetInnerHTML (sanitiza com DOMPurify).
    files: ['components/ui/SafeHtml.tsx'],
    rules: { 'no-restricted-syntax': 'off' },
  },
];

export default eslintConfig;

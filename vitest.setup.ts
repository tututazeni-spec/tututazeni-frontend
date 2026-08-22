// vitest.setup.ts
// Regista os matchers do @testing-library/jest-dom (toBeInTheDocument,
// toBeDisabled, etc.) globalmente para todos os testes de componentes.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Necessário porque test.globals não está activo em vitest.config.ts: o auto-cleanup
// do @testing-library/react não se regista sozinho sem um afterEach global declarado aqui.
afterEach(() => {
  cleanup();
});

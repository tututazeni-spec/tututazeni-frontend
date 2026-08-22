// vitest.setup.ts
// Regista os matchers do @testing-library/jest-dom (toBeInTheDocument,
// toBeDisabled, etc.) globalmente para todos os testes de componentes.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Limpa o DOM após cada teste para evitar poluição entre testes
afterEach(() => {
  cleanup();
});

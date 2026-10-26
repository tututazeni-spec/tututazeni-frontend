// Tipagem do matcher toHaveNoViolations (vitest-axe 0.1 não augmenta o Vitest 4).
import 'vitest';

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

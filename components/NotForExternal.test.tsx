import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotForExternal } from './NotForExternal';

const roleMock = vi.hoisted(() => ({ role: undefined as string | undefined }));
vi.mock('@/hooks/useCurrentRole', () => ({ useCurrentRole: () => roleMock.role }));

describe('NotForExternal', () => {
  test('enquanto o papel não é conhecido não mostra nada', () => {
    roleMock.role = undefined;
    render(<NotForExternal>telemetria</NotForExternal>);
    expect(screen.queryByText('telemetria')).toBeNull();
  });

  test('esconde os filhos ao instrutor externo', () => {
    roleMock.role = 'INSTRUCTOR_EXTERNO';
    render(<NotForExternal>telemetria</NotForExternal>);
    expect(screen.queryByText('telemetria')).toBeNull();
  });

  test('mostra-os a qualquer outro papel', () => {
    roleMock.role = 'COLABORADOR';
    render(<NotForExternal>telemetria</NotForExternal>);
    expect(screen.getByText('telemetria')).toBeTruthy();
  });
});

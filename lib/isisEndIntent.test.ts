import { describe, expect, it } from 'vitest';
import { isEndConversationRequest } from './isisEndIntent';

describe('isEndConversationRequest', () => {
  it.each([
    'encerrar',
    'Encerrar conversa',
    'terminar conversa.',
    'Termina a conversa, por favor',
    'Ísis, encerra a sessão',
    'finalizar conversa',
  ])('reconhece «%s»', (t) => expect(isEndConversationRequest(t)).toBe(true));

  it.each([
    '',
    'como terminar um curso',
    'terminar conversa difícil com um cliente',
    'quero encerrar o meu PDI',
  ])('ignora «%s»', (t) => expect(isEndConversationRequest(t)).toBe(false));
});

// Pedido para terminar a conversa («encerrar», «termina a conversa», …).
// Só aceita frases curtas e só com este vocabulário, para «como terminar um
// curso» ou «terminar conversa difícil com um cliente» seguirem para a Ísis.
const END_INTENT =
  /^(?:(?:isis|por favor|pode|podes|quero|vamos|ja)\s+)*(?:encerrar|encerra|terminar|termina|finalizar|finaliza|acabar|acaba|fechar|fecha)(?:\s+(?:a|esta|essa))?(?:\s+(?:conversa|chamada|sessao|atendimento))?(?:\s+(?:por favor|agora|isis|obrigado|obrigada))*$/;

export function isEndConversationRequest(text: string): boolean {
  const normalised = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalised.length > 0 && END_INTENT.test(normalised);
}

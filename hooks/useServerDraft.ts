// hooks/useServerDraft.ts
// Rascunho local de um formulário inicializado a partir de dados do servidor.
//
// Substitui o padrão repetido nas abas de Definições:
//   const [form, setForm] = useState(null);
//   useEffect(() => { if (data) setForm(data) }, [data]);
// que (1) renderiza uma vez com o rascunho vazio/antigo antes do efeito correr
// e (2) repõe o formulário sempre que o objecto `data` muda — incluindo
// refetches por polling de campos que o formulário nem usa (ex.: TabBackups
// recebe a lista de backups no mesmo payload e apagava edições por gravar
// de 15 em 15 s).
//
// Aqui o rascunho é reposto quando a *fatia* passada em `source` muda de
// referência. O React Query faz structural sharing, por isso uma subárvore
// igual mantém a referência: passa `data?.settings`, não `data`, quando o
// formulário só depende dessa parte. Ajustar estado durante o render (em vez
// de num efeito) é o padrão recomendado pelo React para este caso.
//
// ATENÇÃO: `source` tem de ter referência estável entre renders (dados do
// React Query ou uma fatia deles). Um literal criado no render
// (`[...]`, `{...}`, `.map()`) reporia o rascunho a cada render e entra em loop.

import { useState } from 'react';

export function useServerDraft<TDraft, TSource = TDraft>(
  source: TSource | undefined,
  toDraft: (s: TSource) => TDraft = (s) => s as unknown as TDraft,
) {
  const [draft, setDraft] = useState<TDraft | null>(null);
  const [seen, setSeen] = useState<TSource | undefined>(undefined);

  if (source !== undefined && source !== seen) {
    setSeen(source);
    setDraft(toDraft(source));
  }

  return [draft, setDraft] as const;
}

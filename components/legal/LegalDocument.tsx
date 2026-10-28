// Documento legal (termos / privacidade) legível e acessível, usado nas páginas públicas e no gate.

import type { LegalDoc } from '@/content/legal/types';

export function LegalDocument({ doc }: { doc: LegalDoc }) {
  const draft = doc.version.startsWith('0.');
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">{doc.title}</h1>
      <p className="mt-1 text-xs text-ink-muted">
        Versão {doc.version} · atualizado em{' '}
        <time dateTime={doc.updated}>
          {new Date(`${doc.updated}T12:00:00`).toLocaleDateString('pt-PT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
      </p>
      {draft && (
        <p
          role="note"
          className="mt-4 rounded-control border border-warning bg-warning-subtle p-3 text-sm text-warning-ink"
        >
          Versão de rascunho, ainda em revisão. O texto pode mudar antes de
          entrar em vigor.
        </p>
      )}
      <p className="mt-6 text-sm text-ink">{doc.intro}</p>
      {doc.sections.map((s) => (
        <section key={s.title} className="mt-8">
          <h2 className="font-display text-lg font-bold text-ink">{s.title}</h2>
          {s.paragraphs.map((p, i) => (
            <p key={i} className="mt-2 text-sm leading-relaxed text-ink">
              {p}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}

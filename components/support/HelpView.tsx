'use client';
// Separador "Ajuda": canais e tempos de resposta, perguntas frequentes e pesquisa na base de conhecimento.

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Mail, Search } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { FAQ } from '@/content/faq';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Channels, PRIORITY_HINT, PRIORITY_LABEL } from './types';

interface ArticleHit {
  id: number;
  title: string;
  summary: string | null;
}

export function HelpView() {
  const channels = useApiQuery<Channels>(
    ['support', 'channels'],
    '/support/channels',
  );
  const [term, setTerm] = useState('');
  const debounced = useDebounce(term.trim(), 350);
  const hits = useApiQuery<ArticleHit[]>(
    ['knowledge', 'help-search', debounced],
    '/knowledge/search',
    {
      params: { q: debounced },
      enabled: debounced.length >= 2,
      meta: { silent: true },
    },
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardBody>
          <h2 className="font-display text-lg font-bold text-ink">
            O que procura?
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <Search size={18} className="shrink-0 text-ink-muted" aria-hidden />
            <Input
              aria-label="Pesquisar na base de conhecimento"
              placeholder="Ex.: certificado, férias, palavra-passe"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          {debounced.length >= 2 && (
            <div className="mt-3" aria-live="polite">
              {hits.isLoading ? (
                <p className="text-sm text-ink-muted">A pesquisar…</p>
              ) : (hits.data ?? []).length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Não encontrámos artigos. Veja as perguntas abaixo ou abra um
                  pedido no separador «Os meus pedidos».
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {hits.data!.slice(0, 6).map((a) => (
                    <li key={a.id} className="py-2">
                      <Link
                        href={`/knowledge?article=${a.id}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {a.title}
                      </Link>
                      {a.summary && (
                        <p className="text-xs text-ink-muted">{a.summary}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="font-display text-lg font-bold text-ink">
            Perguntas frequentes
          </h2>
          <div className="mt-3 flex flex-col divide-y divide-border">
            {FAQ.map((f) => (
              <details key={f.id} className="group py-3">
                <summary className="min-h-[44px] cursor-pointer list-none text-sm font-semibold text-ink marker:hidden">
                  {f.question}
                </summary>
                <p className="mt-2 text-sm text-ink-muted">{f.answer}</p>
                {f.href && (
                  <Link
                    href={f.href}
                    className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    Abrir ecrã
                  </Link>
                )}
              </details>
            ))}
          </div>
        </CardBody>
      </Card>

      <QueryBoundary query={channels}>
        {(c) => (
          <Card>
            <CardBody>
              <h2 className="font-display text-lg font-bold text-ink">
                Como falar connosco
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Respondemos {c.hours.toLowerCase()}. Os tempos abaixo são da
                primeira resposta de uma pessoa, contados em horas úteis.
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Tempo de primeira resposta por prioridade
                  </caption>
                  <thead>
                    <tr className="text-ink-muted">
                      <th scope="col" className="py-2 pr-4 font-semibold">
                        Prioridade
                      </th>
                      <th scope="col" className="py-2 pr-4 font-semibold">
                        Quando usar
                      </th>
                      <th scope="col" className="py-2 font-semibold">
                        Primeira resposta
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.responseTargets.map((t) => (
                      <tr key={t.priority} className="border-t border-border">
                        <td className="py-2 pr-4 font-semibold text-ink">
                          {PRIORITY_LABEL[t.priority]}
                        </td>
                        <td className="py-2 pr-4 text-ink-muted">
                          {PRIORITY_HINT[t.priority]}
                        </td>
                        <td className="py-2 text-ink">
                          até {t.businessHours} h útil
                          {t.businessHours === 1 ? '' : 'eis'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                {c.email && (
                  <li className="flex items-center gap-2">
                    <Mail size={16} aria-hidden className="text-ink-muted" />
                    <span className="text-ink-muted">
                      Sem conseguir entrar? Escreva para
                    </span>
                    <a
                      className="font-semibold text-primary hover:underline"
                      href={`mailto:${c.email}`}
                    >
                      {c.email}
                    </a>
                  </li>
                )}
                {c.statusPageUrl && (
                  <li className="flex items-center gap-2">
                    <ExternalLink
                      size={16}
                      aria-hidden
                      className="text-ink-muted"
                    />
                    <a
                      className="font-semibold text-primary hover:underline"
                      href={c.statusPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver estado da plataforma
                    </a>
                  </li>
                )}
              </ul>
            </CardBody>
          </Card>
        )}
      </QueryBoundary>
    </div>
  );
}

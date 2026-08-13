// components/search/ResultCard.tsx

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { TYPE_CONFIG } from './types';
import type { SearchResult } from './types';

interface ResultCardProps {
  result: SearchResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const conf = TYPE_CONFIG[result.type] ?? TYPE_CONFIG.content;
  const Icon = conf.icon;

  return (
    <a
      href={result.url ?? '#'}
      className="group flex items-center gap-3 rounded-card p-3 transition-colors hover:bg-surface-sunken"
    >
      {result.avatarUrl || result.thumbnailUrl ? (
        <Image
          src={(result.avatarUrl || result.thumbnailUrl)!}
          alt={result.title}
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-control object-cover"
        />
      ) : (
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${conf.bg}`}
        >
          <Icon size={16} strokeWidth={1.75} className={conf.color} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-medium text-ink">{result.title}</p>
        <p className="truncate font-body text-[10px] text-ink-faint">{result.subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {result.mandatory && (
          <Badge intent="danger" className="px-1.5 py-0 text-[9px]">
            OBRIG.
          </Badge>
        )}
        <ChevronRight
          size={14}
          strokeWidth={1.75}
          className="text-ink-faint transition-colors group-hover:text-ink-muted"
        />
      </div>
    </a>
  );
}

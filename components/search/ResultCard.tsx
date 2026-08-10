// components/search/ResultCard.tsx

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
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
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
    >
      {result.avatarUrl || result.thumbnailUrl ? (
        <Image
          src={(result.avatarUrl || result.thumbnailUrl)!}
          alt={result.title}
          width={36}
          height={36}
          className="w-9 h-9 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div
          className={`w-9 h-9 rounded-lg ${conf.bg} flex items-center justify-center shrink-0`}
        >
          <Icon size={16} className={conf.color} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {result.title}
        </p>
        <p className="text-[10px] text-slate-400 truncate">{result.subtitle}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {result.mandatory && (
          <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
            OBRIG.
          </span>
        )}
        <ChevronRight
          size={13}
          className="text-slate-300 group-hover:text-slate-500 transition-colors"
        />
      </div>
    </a>
  );
}

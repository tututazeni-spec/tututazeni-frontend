// components/trainings/TrainingCard.tsx
// Cartão de treinamento no catálogo. Extraído de
// app/(platform)/trainings/page.tsx.

'use client';

import Image from 'next/image';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, StarRating } from './atoms';
import { LEVEL_CFG, TYPE_CFG } from './constants';
import { fmtHours } from './utils';
import type { Training } from './types';

interface TrainingCardProps {
  training: Training;
  onClick: () => void;
}

export function TrainingCard({ training, onClick }: TrainingCardProps) {
  const typeCfg = TYPE_CFG[training.type];

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-blue-600 to-blue-900 relative overflow-hidden">
        {training.thumbnailUrl ? (
          <Image
            src={training.thumbnailUrl}
            alt=""
            fill
            className="object-cover opacity-80 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
            {typeCfg.icon}
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium ${typeCfg.cls}`}
          >
            {typeCfg.icon} {typeCfg.label}
          </span>
        </div>
        {training.mandatory && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded">
            Obrigatório
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {training.category && (
          <div className="text-xs text-blue-600 font-medium mb-1">
            {training.category}
          </div>
        )}
        <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-700 transition-colors">
          {training.title}
        </div>
        {training.shortDescription && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {training.shortDescription}
          </p>
        )}

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <StatusBadge value={training.level} map={LEVEL_CFG} />
          <span className="text-xs text-gray-400">
            ⏱ {fmtHours(training.workloadHours)}
          </span>
          {training.issueCertificate && (
            <span className="text-xs text-amber-600">🏆 Certificado</span>
          )}
        </div>

        {training.instructor && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar
              name={training.instructor.fullName}
              avatarUrl={training.instructor.avatarUrl}
              size="sm"
            />
            <span className="text-xs text-gray-500">
              {training.instructor.fullName}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <StarRating value={training.avgRating ?? null} />
          <span className="text-xs text-gray-400">
            {training._count.participants} inscritos
          </span>
        </div>
      </div>
    </div>
  );
}

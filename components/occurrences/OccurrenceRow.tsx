import React from 'react';
import type { Problem } from '@/data/mockData';
import { RecordCard } from '@/components/ui/RecordCard';
import { assetUrl } from '@/services/http';
import { formatDate, getStatusLabel } from '@/utils/occurrenceLabels';
export interface OccurrenceRowProps {
  problem: Problem;
  onPress: () => void;
  featured?: boolean;
}
export function OccurrenceRow({ problem, onPress, featured }: OccurrenceRowProps) {
  return (
    <RecordCard
      title={problem.title}
      featured={featured}
      metrics={{ views: problem.views ?? 0, supports: problem.votes }}
      label={getStatusLabel(problem.status)}
      meta={[problem.location?.address, formatDate(problem.reportedAt)]
        .filter(Boolean)
        .join(' · ')}
      image={problem.images?.[0] ? assetUrl(problem.images[0]) : undefined}
      onPress={onPress}
      action="Ver ocorrência"
    />
  );
}

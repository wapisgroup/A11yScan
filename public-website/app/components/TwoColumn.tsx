'use client';

import { TwoColumnComponent } from '@/lib/types';
import { ComponentRenderer } from './ComponentRenderer';

export function TwoColumn({ data }: { data: TwoColumnComponent }) {
  const { leftColumn, rightColumn, ratio = '1fr_1fr' } = data;

  // Determine grid template columns based on ratio
  const gridTemplateColumns = {
    '1fr_1fr': 'grid-cols-1 md:grid-cols-2',
    '2fr_1fr': 'grid-cols-1 md:grid-cols-[2fr_1fr]',
    '1fr_2fr': 'grid-cols-1 md:grid-cols-[1fr_2fr]',
  };

  return (
    <div className={`grid ${gridTemplateColumns[ratio]} gap-8 md:gap-12 items-center`}>
      <div className="space-y-6">
        {leftColumn && leftColumn.length > 0 ? (
          <ComponentRenderer components={leftColumn} />
        ) : null}
      </div>
      <div className="space-y-6">
        {rightColumn && rightColumn.length > 0 ? (
          <ComponentRenderer components={rightColumn} />
        ) : null}
      </div>
    </div>
  );
}

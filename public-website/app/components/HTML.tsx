'use client';

import { HTMLComponent } from '@/lib/types';

export function HTML({ data }: { data: HTMLComponent }) {
  const { htmlContent } = data;

  if (!htmlContent) {
    return null;
  }

  return (
    <div 
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

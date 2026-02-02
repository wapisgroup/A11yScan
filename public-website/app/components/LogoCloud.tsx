'use client';

import { LogoCloudComponent } from '@/lib/types';
import Image from 'next/image';

export default function LogoCloud({ data }: { data: LogoCloudComponent }) {
  if (!data.logos || data.logos.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      {(data.title || data.description) && (
        <div className="text-center max-w-3xl mx-auto mb-12">
          {data.title && (
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              {data.title}
            </h2>
          )}
          {data.description && (
            <p className="text-slate-600">
              {data.description}
            </p>
          )}
        </div>
      )}
      
      <div className={`grid grid-cols-2 ${
        data.logos.length <= 4 ? 'md:grid-cols-4 max-w-4xl' :
        data.logos.length <= 6 ? 'md:grid-cols-3 lg:grid-cols-6 max-w-6xl' :
        'md:grid-cols-4 lg:grid-cols-5 max-w-7xl'
      } mx-auto gap-8 items-center justify-items-center`}>
        {data.logos.map((logo) => (
          <div
            key={logo._key}
            className="flex items-center justify-center p-4 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
          >
            {logo.url ? (
              <Image
                src={logo.url}
                alt={logo.alt || logo.name || 'Company logo'}
                width={logo.width || 120}
                height={logo.height || 40}
                className="max-w-full h-auto"
              />
            ) : (
              <div className="text-slate-400 font-semibold text-lg">
                {logo.name}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

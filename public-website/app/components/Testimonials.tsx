'use client';

import { TestimonialsComponent } from '@/lib/types';
import Image from 'next/image';

export default function Testimonials({ data }: { data: TestimonialsComponent }) {
  if (!data.testimonials || data.testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      {(data.title || data.description) && (
        <div className="text-center max-w-3xl mx-auto mb-12">
          {data.title && (
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {data.title}
            </h2>
          )}
          {data.description && (
            <p className="text-lg text-slate-600">
              {data.description}
            </p>
          )}
        </div>
      )}
      
      <div className={`grid grid-cols-1 ${
        data.testimonials.length === 1 ? 'max-w-2xl mx-auto' :
        data.testimonials.length === 2 ? 'md:grid-cols-2 max-w-5xl mx-auto gap-8' :
        'md:grid-cols-2 lg:grid-cols-3 gap-8'
      }`}>
        {data.testimonials.map((testimonial) => (
          <div
            key={testimonial._key}
            className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col"
          >
            {/* Quote */}
            <div className="mb-6 flex-grow">
              <svg className="w-10 h-10 text-purple-600 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-slate-700 text-lg leading-relaxed">
                "{testimonial.quote}"
              </p>
            </div>

            {/* Author info */}
            <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
              {testimonial.avatar ? (
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <div className="font-semibold text-slate-900">
                  {testimonial.name}
                </div>
                {(testimonial.title || testimonial.company) && (
                  <div className="text-sm text-slate-600">
                    {testimonial.title}
                    {testimonial.title && testimonial.company && ', '}
                    {testimonial.company}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

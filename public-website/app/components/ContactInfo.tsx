'use client';

import React from 'react';
import { ContactInfoComponent } from '@/lib/types';
import { HiEnvelope, HiLifebuoy, HiUserGroup, HiPhone, HiMapPin } from 'react-icons/hi2';

const iconMap = {
  email: HiEnvelope,
  support: HiLifebuoy,
  partners: HiUserGroup,
  phone: HiPhone,
  location: HiMapPin,
};

export default function ContactInfo({ data }: { data: ContactInfoComponent }) {
  // Debug logging
  console.log('ContactInfo component data:', data);
  
  // Safety check for items array
  if (!data.items || data.items.length === 0) {
    console.log('ContactInfo: No items found, returning null');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {data.title && (
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-3">
          {data.title}
        </h2>
      )}
      {data.description && (
        <p className="text-lg text-slate-600 text-center mb-12">
          {data.description}
        </p>
      )}
      
      <div className={`grid grid-cols-1 ${
        data.items.length === 2 ? 'md:grid-cols-2' : 
        data.items.length >= 3 ? 'md:grid-cols-3' : 
        'md:grid-cols-1'
      } gap-8`}>
        {data.items.map((item, index) => {
          const IconComponent = iconMap[item.icon as keyof typeof iconMap] || HiEnvelope;
          
          return (
            <div
              key={item._key || index}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center hover:shadow-md transition-shadow"
            >
              <div className="flex justify-center mb-6">
                <IconComponent className="w-16 h-16 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-slate-600 mb-6">
                  {item.description}
                </p>
              )}
              {item.email && (
                <a
                  href={`mailto:${item.email}`}
                  className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                >
                  {item.email}
                </a>
              )}
              {item.phone && (
                <a
                  href={`tel:${item.phone}`}
                  className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                >
                  {item.phone}
                </a>
              )}
              {item.customText && (
                <p className="text-slate-700 font-medium">
                  {item.customText}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

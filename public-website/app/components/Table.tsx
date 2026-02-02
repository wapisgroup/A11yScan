'use client';

import { TableComponent, ReusableTableComponent } from '@/lib/types';

export default function Table({ data }: { data: TableComponent | ReusableTableComponent }) {
  if (!data.rows || data.rows.length === 0) {
    return null;
  }

  // Handle both inline tables (title) and reusable tables (displayTitle)
  const displayTitle = 'displayTitle' in data ? data.displayTitle : data.title;

  return (
    <div className="py-8">
      {(displayTitle || data.description) && (
        <div className="mb-6">
          {displayTitle && (
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {displayTitle}
            </h3>
          )}
          {data.description && (
            <p className="text-slate-600">
              {data.description}
            </p>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {data.headers && data.headers.length > 0 && (
            <thead>
              <tr className="border-b border-slate-200">
                {data.headers.map((header, index) => (
                  <th
                    key={index}
                    className="text-left py-3 px-4 text-sm font-semibold text-slate-700 bg-slate-50"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {data.rows.map((row) => (
              <tr
                key={row._key}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                {row.cells.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="py-3 px-4 text-sm text-slate-700"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

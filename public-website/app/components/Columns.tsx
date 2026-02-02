'use client'

import { ColumnsComponent } from '@/lib/types'
import { ComponentRenderer } from './ComponentRenderer'

interface ColumnsProps {
  data: ColumnsComponent
}

export function Columns({ data }: ColumnsProps) {
  const { numberOfColumns, columns } = data

  if (!columns || columns.length === 0) {
    return null
  }

  // Grid column classes based on number of columns
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
    5: 'md:grid-cols-2 lg:grid-cols-5',
    6: 'md:grid-cols-2 lg:grid-cols-6',
  }

  const gridClass = gridClasses[numberOfColumns] || gridClasses[2]

  // Flatten all components from all columns into single array
  const allComponents = columns.flatMap(column => column.components || [])

  return (
    <div className={`grid ${gridClass} gap-6 md:gap-8`}>
      <ComponentRenderer components={allComponents} />
    </div>
  )
}

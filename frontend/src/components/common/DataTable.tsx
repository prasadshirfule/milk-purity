import React from 'react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no items matching your criteria.'
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-dairy-500 border-t-transparent" />
        <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading dairy records...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {columns.map((col, idx) => (
              <th key={idx} className={`py-3.5 px-4 font-semibold ${alignClasses[col.align || 'left']} ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {data.map((item) => {
            const key = keyExtractor(item);
            return (
              <tr
                key={key}
                onClick={() => onRowClick && onRowClick(item)}
                className={`transition-colors ${
                  onRowClick ? 'hover:bg-slate-50/80 cursor-pointer' : 'hover:bg-slate-50/40'
                }`}
              >
                {columns.map((col, idx) => {
                  let content: React.ReactNode;
                  if (typeof col.accessor === 'function') {
                    content = col.accessor(item);
                  } else if (col.accessor) {
                    content = item[col.accessor] as unknown as React.ReactNode;
                  } else {
                    content = null;
                  }

                  return (
                    <td
                      key={idx}
                      className={`py-3.5 px-4 align-middle ${alignClasses[col.align || 'left']} ${
                        col.className || ''
                      }`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

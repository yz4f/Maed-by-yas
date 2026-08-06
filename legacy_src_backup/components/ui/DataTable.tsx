import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, ChevronUp, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card } from './Card.tsx';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  itemsPerPage?: number;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'ابحث...',
  searchable = true,
  searchKeys = [],
  itemsPerPage = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);

  // Filter
  const filteredData = React.useMemo(() => {
    if (!searchable || !search || searchKeys.length === 0) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const val = item[key];
        return val != null && String(val).toLowerCase().includes(lowerSearch);
      })
    );
  }, [data, search, searchable, searchKeys]);

  // Sort
  const sortedData = React.useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <Card variant="default" className="flex flex-col border border-white/[0.05]" noPadding>
      {/* Toolbar */}
      {searchable && (
        <div className="p-4 border-b border-white/[0.05] flex items-center justify-between gap-4 bg-[#0B1220]/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#030712] border border-white/10 rounded-xl py-2 pr-10 pl-4 text-sm text-white placeholder-gray-500 focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9]/50 transition-all outline-none"
            />
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[#0B1220]/80">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/[0.05] ${
                    col.sortable ? 'cursor-pointer hover:text-white transition-colors select-none' : ''
                  }`}
                  onClick={() => col.sortable && col.accessorKey && requestSort(col.accessorKey)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable && col.accessorKey && (
                      <span className="flex flex-col text-[10px] text-gray-600">
                        <ChevronUp
                          className={`w-3 h-3 -mb-1 ${
                            sortConfig?.key === col.accessorKey && sortConfig.direction === 'asc'
                              ? 'text-[#0EA5E9]'
                              : ''
                          }`}
                        />
                        <ChevronDown
                          className={`w-3 h-3 ${
                            sortConfig?.key === col.accessorKey && sortConfig.direction === 'desc'
                              ? 'text-[#0EA5E9]'
                              : ''
                          }`}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            <AnimatePresence mode="popLayout">
              {paginatedData.length > 0 ? (
                paginatedData.map((item, rowIndex) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: rowIndex * 0.05 }}
                    key={rowIndex}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className="p-4 text-sm text-gray-300">
                        {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey]) : null}
                      </td>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-gray-500 text-sm">
                    لا توجد بيانات متاحة
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-white/[0.05] flex items-center justify-between bg-[#0B1220]/50">
          <span className="text-xs text-gray-500">
            الصفحة {currentPage} من {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

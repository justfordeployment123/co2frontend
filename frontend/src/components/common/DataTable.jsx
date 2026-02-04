import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const DataTable = ({
  data = [],
  columns = [],
  onRowClick,
  onSort,
  sortBy,
  sortOrder = 'asc',
  pagination = true,
  pageSize: initialPageSize = 10,
  searchable = false,
  selectable = false,
  onSelectionChange,
  loading = false,
  emptyMessage,
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Filter data by search query
  const filteredData = useMemo(() => {
    const dataArray = Array.isArray(data) ? data : [];
    if (!searchQuery) return dataArray;
    
    return dataArray.filter((row) =>
      columns.some((col) => {
        const value = col.accessor ? col.accessor(row) : row[col.key];
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  }, [data, searchQuery, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (column) => {
    if (!column.sortable) return;
    onSort?.(column.key);
  };

  const handleRowSelection = (rowId) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    setSelectedRows(newSelection);
    onSelectionChange?.(Array.from(newSelection));
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const allIds = new Set(paginatedData.map((row, idx) => row.id || idx));
      setSelectedRows(allIds);
      onSelectionChange?.(Array.from(allIds));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-mist border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Search Bar */}
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder={t('common.search') || 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-primary-light border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-mist"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-carbon-gray rounded-lg">
        <table className="w-full">
          <thead className="bg-midnight-navy-lighter border-b border-carbon-gray">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-cyan-mist bg-midnight-navy border-carbon-gray rounded focus:ring-cyan-mist"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-off-white uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-midnight-navy' : ''
                  }`}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && sortBy === column.key && (
                      <span className="text-cyan-mist">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-carbon-gray">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center text-stone-gray">
                  {emptyMessage || t('common.noData') || 'No data available'}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className={`hover:bg-midnight-navy-lighter transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id || idx)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRowSelection(row.id || idx);
                        }}
                        className="w-4 h-4 text-cyan-mist bg-midnight-navy border-carbon-gray rounded focus:ring-cyan-mist"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm text-off-white">
                      {column.render
                        ? column.render(row)
                        : column.accessor
                        ? column.accessor(row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && filteredData.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-stone-gray">
            {t('common.showing')} {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredData.length)} {t('common.of')} {filteredData.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-midnight-navy-lighter border border-carbon-gray rounded text-off-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-midnight-navy"
            >
              {t('common.previous')}
            </button>
            <span className="text-sm text-off-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-midnight-navy-lighter border border-carbon-gray rounded text-off-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-midnight-navy"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;

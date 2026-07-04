import { useState, useMemo } from 'react'
import { Eye, Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Search, Trash } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './table'

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  onCreate?: string | (() => void)
  editLink?: (id: number) => string
  onEdit?: (id: number) => void
  onView?: (id: number) => void
  onDelete?: (id: number) => void
  onBulkDelete?: (ids: number[]) => void
  renderActions?: (item: T) => React.ReactNode
  keyExtractor: (item: T) => number
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
}

function renderCellValue<T>(item: T, col: Column<T>): string {
  if (col.render) {
    const node = col.render(item)
    if (typeof node === 'string') return node
    if (typeof node === 'number') return String(node)
    return ''
  }
  return String((item as any)[col.key] ?? '')
}

export default function DataTable<T>({
  columns, data, loading, onCreate, editLink, onEdit, onView, onDelete, onBulkDelete, keyExtractor,
  searchable, searchPlaceholder, pageSize = 15, renderActions,
}: Props<T>) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const filtered = useMemo(() => {
    if (!searchTerm) return data
    const q = searchTerm.toLowerCase()
    return data.filter((item) =>
      columns.some((col) => renderCellValue(item, col).toLowerCase().includes(q))
    )
  }, [data, searchTerm, columns])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageData = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const handleSearch = (val: string) => {
    setSearchTerm(val)
    setPage(1)
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const pageIds = pageData.map(keyExtractor)
    const allSelected = pageIds.every((id) => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  const hasActions = !!(editLink || onEdit || onView || onDelete || renderActions)
  const hasBulk = !!onBulkDelete
  const colCount = columns.length + (hasActions ? 1 : 0) + (hasBulk ? 1 : 0)

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="px-5 py-4 border-b flex items-center justify-between gap-4">
        {searchable && (
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder || t('common.search')}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            />
          </div>
        )}
        <div className="flex-1" />
        {onCreate && (
          <div className="flex-shrink-0">
            {typeof onCreate === 'string' ? (
              <Button asChild>
                <Link to={onCreate}><Plus size={16} /> {t('common.create')}</Link>
              </Button>
            ) : (
              <Button onClick={onCreate}><Plus size={16} /> {t('common.create')}</Button>
            )}
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">
            {selectedIds.size} {t('common.selected')}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearSelection}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onBulkDelete!(Array.from(selectedIds))
                clearSelection()
              }}
            >
              <Trash size={14} className="mr-1" />
              {t('common.delete')} ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {hasBulk && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={pageData.length > 0 && pageData.every((item) => selectedIds.has(keyExtractor(item)))}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              {hasActions && <TableHead className="text-right">{t('common.actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center py-12 text-muted-foreground">
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center py-12 text-muted-foreground">
                  {searchTerm ? t('common.no_results') : 'No records found'}
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((item) => {
                const id = keyExtractor(item)
                return (
                  <TableRow key={id}>
                    {hasBulk && (
                      <TableCell className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(id)}
                          onChange={() => toggleSelect(id)}
                          className="rounded"
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                      </TableCell>
                    ))}
                    {hasActions && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {renderActions?.(item)}
                          {onView && (
                            <Button variant="ghost" size="icon" onClick={() => onView(id)}>
                              <Eye size={15} />
                            </Button>
                          )}
                          {editLink && (
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={editLink(id)}><Pencil size={15} /></Link>
                            </Button>
                          )}
                          {onEdit && (
                            <Button variant="ghost" size="icon" onClick={() => onEdit(id)}>
                              <Pencil size={15} />
                            </Button>
                          )}
                          {onDelete && (
                            <Button variant="ghost" size="icon" onClick={() => onDelete(id)}>
                              <Trash2 size={15} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > pageSize && (
        <div className="px-5 py-3 border-t flex items-center justify-between text-sm text-gray-500">
          <span>{filtered.length} registros — Pág. {safePage} de {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-300">...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] h-8 rounded text-sm font-medium transition-colors ${
                      p === safePage
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

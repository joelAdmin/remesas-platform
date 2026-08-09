import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { remittanceRepository } from '../../services/repositories/RemittanceRepository'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ErrorBoundary from '../../components/ui/ErrorBoundary'
import { Separator } from '../../components/ui/separator'
import { fmt } from '../../lib/utils'
import { useConfirm } from '../../components/ui/ConfirmDialog'
import RemittanceFormPage from './RemittanceFormPage'
import type { Remittance } from '../../types/entities'
import { toast } from 'sonner'
import { Calendar, Clock } from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_process: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export default function RemittanceListPage() {
  const { t } = useTranslation()
  const { confirm, ConfirmDialog } = useConfirm()
  const [data, setData] = useState<Remittance[]>([])
  const [loading, setLoading] = useState(true)
  const [viewItem, setViewItem] = useState<Remittance | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  const fetch = () => {
    setLoading(true)
    remittanceRepository.all().then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => {
    setEditId(null)
    setModalOpen(true)
  }

  const openEdit = (id: number) => {
    setEditId(id)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!await confirm(t('common.confirm_delete'))) return
    try {
      await remittanceRepository.delete(id)
      toast.success(t('remittance.deleted_successfully'))
      fetch()
    } catch {
      toast.error('Error al eliminar la remesa')
    }
  }

  const handleBulkDelete = async (ids: number[]) => {
    if (!await confirm(`¿Eliminar ${ids.length} registro(s)?`)) return
    try {
      await Promise.all(ids.map((id) => remittanceRepository.delete(id)))
      toast.success(`${ids.length} registro(s) eliminado(s)`)
      fetch()
    } catch {
      toast.error('Error al eliminar la remesa')
    }
  }

  const handleView = (id: number) => {
    const item = data.find((r) => r.id === id) || null
    setViewItem(item)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('remittance.title')}</h1>
      <DataTable<Remittance>
        columns={[
          { key: 'ref_ve', label: t('remittance.ref') },
          { key: 'origin_amount', label: t('remittance.origin_amount'), render: (item) => fmt(item.origin_amount) },
          { key: 'usdt_bought', label: t('remittance.usdt_bought'), render: (item) => fmt(item.usdt_bought) },
          { key: 'usdt_to_sell', label: t('remittance.usdt_to_sell'), render: (item) => fmt(item.usdt_to_sell) },
          { key: 'destination_net_amount', label: t('remittance.destination_net'), render: (item) => fmt(item.destination_net_amount) },
          { key: 'total_profit_usd', label: t('remittance.total_profit'), render: (item) => fmt(item.total_profit_usd) },
          { key: 'registered_at', label: t('remittance.registered_at') },
          { key: 'status', label: t('common.status') },
        ]}
        data={data}
        loading={loading}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onView={handleView}
        keyExtractor={(item) => item.id}
        searchable
      />

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="" size="xl">
        {viewItem && <RemittanceViewDetail item={viewItem} t={t} statusColors={statusColors} />}
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t(editId ? 'remittance.edit' : 'remittance.create')} size="xl">
        <ErrorBoundary>
          <RemittanceFormPage
            showHeader={false}
            modal
            editId={editId ?? undefined}
            onSuccess={() => {
              setModalOpen(false)
              fetch()
            }}
          />
        </ErrorBoundary>
      </Modal>
      <ConfirmDialog />
    </div>
  )
}

function RemittanceViewDetail({ item, t, statusColors }: { item: Remittance; t: (key: string) => string; statusColors: Record<string, string> }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{item.ref_ve}</h2>
          <p className="text-xs text-gray-500">{item.client?.full_name ?? `Cliente #${item.client_id}`} — {item.exchange_corridor?.name ?? `Corredor #${item.exchange_corridor_id}`}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[item.status] || 'bg-gray-100 text-gray-700'}`}>
          {t(`remittance.status_${item.status}`)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs text-blue-500 font-medium mb-2">{t('remittance.origin_amount')}</p>
          <p className="text-xl font-bold text-blue-700">${fmt(item.origin_amount, 0)}</p>
          <div className="mt-2 space-y-1 text-xs text-blue-600">
            <p>{t('remittance.buy_rate')}: {fmt(item.buy_rate, 4)}</p>
            <p>{t('remittance.sell_rate')}: {fmt(item.sell_rate, 4)}</p>
          </div>
        </div>
        <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
          <p className="text-xs text-violet-500 font-medium mb-2">USDT</p>
          <p className="text-xl font-bold text-violet-700">{fmt(item.usdt_bought)} Comprados</p>
          <div className="mt-2 space-y-1 text-xs text-violet-600">
            <p>A Vender: {fmt(item.usdt_to_sell)}</p>
            <p className="font-semibold">Profit: {fmt(item.profit_usdt)} USDT</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-2">{t('remittance.destination_net')}</p>
          <p className="text-lg font-semibold text-gray-800">{fmt(item.destination_net_amount)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-xs text-emerald-500 font-medium mb-2">{t('remittance.total_profit')}</p>
          <p className="text-lg font-semibold text-emerald-700">{fmt(item.total_profit_usd)} USD</p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-xs text-gray-500 font-medium mb-2">{t('remittance.origin_commission')}</p>
          <p className="text-gray-800">{fmt(item.origin_commission_percent)}% + {fmt(item.origin_commission_fixed)} = <span className="font-semibold">{fmt(item.origin_commission_total)}</span></p>
          <p className="text-xs text-gray-400 mt-1">Neto Origen: {fmt(item.origin_net_amount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium mb-2">{t('remittance.destination_commission')}</p>
          <p className="text-gray-800">{fmt(item.destination_commission_percent)}% + {fmt(item.destination_commission_fixed)} = <span className="font-semibold">{fmt(item.destination_commission_total)}</span></p>
          <p className="text-xs text-gray-400 mt-1">Bruto Destino: {fmt(item.destination_gross_amount)}</p>
        </div>
      </div>

      {item.client_account_id && (
        <div className="text-sm">
          <p className="text-xs text-gray-500 font-medium">{t('remittance.destination_account')}:</p>
          <p className="text-gray-800">{item.client?.full_name ?? `#${item.client_id}`}</p>
        </div>
      )}

      {(item.promoters ?? []).length > 0 && (
        <div className="text-sm">
          <p className="text-xs text-gray-500 font-medium mb-2">{t('remittance.promoters')}</p>
          <div className="space-y-1">
            {(item.promoters ?? []).map((p: any) => (
              <div key={p.user_id} className="flex justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-gray-700">{p.user?.name ?? `#${p.user_id}`}</span>
                <span className="font-medium text-gray-900">{p.profit_percent}%</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {t('remittance.owner_share')}: {fmt(100 - (item.promoters || []).reduce((s: number, p: any) => s + Number(p.profit_percent), 0))}%
          </p>
        </div>
      )}

      {(item.origin_receipt_url || item.destination_receipt_url) && (
        <div className="grid grid-cols-2 gap-4">
          {item.origin_receipt_url && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">{t('remittance.origin_receipt')}</p>
              <img src={item.origin_receipt_url} alt="Origin receipt" className="w-full h-28 object-cover rounded-lg border border-gray-200 cursor-pointer"
                onClick={() => window.open(item.origin_receipt_url!, '_blank')} />
            </div>
          )}
          {item.destination_receipt_url && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">{t('remittance.destination_receipt')}</p>
              <img src={item.destination_receipt_url} alt="Destination receipt" className="w-full h-28 object-cover rounded-lg border border-gray-200 cursor-pointer"
                onClick={() => window.open(item.destination_receipt_url!, '_blank')} />
            </div>
          )}
        </div>
      )}

      {item.notes && (
        <div className="text-sm">
          <p className="text-xs text-gray-500 font-medium">{t('remittance.notes')}</p>
          <p className="text-gray-700 mt-0.5">{item.notes}</p>
        </div>
      )}

      <div className="flex gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Calendar size={12} />{t('remittance.registered_at')}: {item.registered_at ?? (item.created_at ? new Date(item.created_at).toLocaleDateString() : '-')}</span>
        <span className="flex items-center gap-1"><Clock size={12} />Actualizado: {item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}</span>
      </div>
    </div>
  )
}

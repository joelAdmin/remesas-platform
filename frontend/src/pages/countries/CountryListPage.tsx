import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { countryRepository } from '../../services/repositories/CountryRepository'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { useConfirm } from '../../components/ui/ConfirmDialog'
import type { Country } from '../../types/entities'
import { Plus } from 'lucide-react'

export default function CountryListPage() {
  const { t } = useTranslation()
  const { confirm, ConfirmDialog } = useConfirm()
  const [data, setData] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Country | null>(null)
  const [form, setForm] = useState({ name: '', currency_code: '', currency_symbol: '', phone_code: '', flag_icon: '' })
  const [saving, setSaving] = useState(false)

  const fetch = () => {
    setLoading(true)
    countryRepository.all().then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => {
    setEditItem(null)
    setForm({ name: '', currency_code: '', currency_symbol: '', phone_code: '', flag_icon: '' })
    setModalOpen(true)
  }

  const openEdit = (id: number) => {
    const item = data.find((d) => d.id === id)
    if (!item) return
    setEditItem(item)
    setForm({ name: item.name, currency_code: item.currency_code, currency_symbol: item.currency_symbol, phone_code: item.phone_code, flag_icon: item.flag_icon || '' })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        await countryRepository.update(editItem.id, form)
      } else {
        await countryRepository.create(form)
      }
      setModalOpen(false)
      fetch()
    } catch {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!await confirm(t('common.confirm_delete'))) return
    try {
      await countryRepository.delete(id)
      toast.success('Eliminado exitosamente')
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleBulkDelete = async (ids: number[]) => {
    if (!await confirm(`¿Eliminar ${ids.length} registro(s)?`)) return
    try {
      await Promise.all(ids.map((id) => countryRepository.delete(id)))
      toast.success(`${ids.length} registro(s) eliminado(s)`)
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('country.title')}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all">
          <Plus size={18} /> {t('common.create')}
        </button>
      </div>

      <DataTable<Country>
        columns={[
          { key: 'name', label: t('country.name') },
          { key: 'currency_code', label: t('country.currency_code') },
          { key: 'currency_symbol', label: t('country.currency_symbol') },
          { key: 'phone_code', label: t('country.phone_code') },
        ]}
        data={data}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        keyExtractor={(item) => item.id}
        searchable
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t(editItem ? 'country.edit' : 'country.create')} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('country.name')}</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('country.currency_code')}</label>
              <input value={form.currency_code} onChange={(e) => setForm((p) => ({ ...p, currency_code: e.target.value }))} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('country.currency_symbol')}</label>
              <input value={form.currency_symbol} onChange={(e) => setForm((p) => ({ ...p, currency_symbol: e.target.value }))} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('country.phone_code')}</label>
              <input value={form.phone_code} onChange={(e) => setForm((p) => ({ ...p, phone_code: e.target.value }))} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('country.flag_icon')}</label>
              <input value={form.flag_icon} onChange={(e) => setForm((p) => ({ ...p, flag_icon: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all">
              {saving ? t('common.loading') : t('common.save')}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog />
    </div>
  )
}

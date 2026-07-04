import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { currencyRepository } from '../../services/repositories/CurrencyRepository'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { FormField } from '../../components/ui/FormField'
import { useConfirm } from '../../components/ui/ConfirmDialog'
import { handleFormErrors } from '../../lib/formUtils'
import type { Currency } from '../../types/entities'

interface FormData {
  code: string
  name: string
  symbol: string
  decimals: number
  is_crypto: boolean
}

export default function CurrencyListPage() {
  const { t } = useTranslation()
  const { confirm, ConfirmDialog } = useConfirm()
  const [data, setData] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const isEdit = editingId !== null

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  const fetch = () => {
    setLoading(true)
    currencyRepository.all().then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => {
    setEditingId(null)
    reset({ code: '', name: '', symbol: '', decimals: 2, is_crypto: false })
    setModalOpen(true)
  }

  const openEdit = async (id: number) => {
    setEditingId(id)
    try {
      const item = await currencyRepository.find(id)
      reset({ code: item.code, name: item.name, symbol: item.symbol, decimals: item.decimals, is_crypto: item.is_crypto })
      setModalOpen(true)
    } catch {
      toast.error('Error al cargar moneda')
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await currencyRepository.update(editingId!, data)
      } else {
        await currencyRepository.create(data)
      }
      toast.success('Guardado exitosamente')
      setModalOpen(false)
      fetch()
    } catch (err) {
      if (!handleFormErrors(err, setError)) toast.error('Error al guardar')
    }
  }

  const handleDelete = async (id: number) => {
    if (!await confirm(t('common.confirm_delete'))) return
    try {
      await currencyRepository.delete(id)
      toast.success('Eliminado exitosamente')
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleBulkDelete = async (ids: number[]) => {
    if (!await confirm(`¿Eliminar ${ids.length} registro(s)?`)) return
    try {
      await Promise.all(ids.map((id) => currencyRepository.delete(id)))
      toast.success(`${ids.length} registro(s) eliminado(s)`)
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('currency.title')}</h1>
      <DataTable<Currency>
        columns={[
          { key: 'code', label: t('currency.code') },
          { key: 'name', label: t('currency.name') },
          { key: 'symbol', label: t('currency.symbol') },
          { key: 'decimals', label: t('currency.decimals') },
          { key: 'is_crypto', label: t('currency.is_crypto'), render: (item) => item.is_crypto ? 'Yes' : 'No' },
        ]}
        data={data}
        loading={loading}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        keyExtractor={(item) => item.id}
        searchable
      />
      <ConfirmDialog />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t(isEdit ? 'currency.edit' : 'currency.create')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('currency.code')} error={errors.code?.message} required>
              <input {...register('code', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.code} />
            </FormField>
            <FormField label={t('currency.symbol')} error={errors.symbol?.message} required>
              <input {...register('symbol', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.symbol} />
            </FormField>
          </div>
          <FormField label={t('currency.name')} error={errors.name?.message} required>
            <input {...register('name', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.name} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('currency.decimals')} error={errors.decimals?.message} required>
              <input type="number" {...register('decimals', { required: 'Required', min: 0, max: 8, valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.decimals} />
            </FormField>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('is_crypto')} className="rounded" />
                <span className="text-sm font-medium text-gray-700">{t('currency.is_crypto')}</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {t('common.save')}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

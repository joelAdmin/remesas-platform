import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'
import { exchangeCorridorRepository } from '../../services/repositories/ExchangeCorridorRepository'
import { currencyRepository } from '../../services/repositories/CurrencyRepository'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { FormField } from '../../components/ui/FormField'
import NumberInput from '../../components/ui/NumberInput'
import InlineCreateModal from '../../components/ui/InlineCreateModal'
import { useConfirm } from '../../components/ui/ConfirmDialog'
import { handleFormErrors } from '../../lib/formUtils'
import { fmt } from '../../lib/utils'
import type { ExchangeCorridor, Currency } from '../../types/entities'
import type { Field } from '../../components/ui/InlineCreateModal'

interface FormData {
  origin_currency_id: number
  destination_currency_id: number
  name: string
  is_active: boolean
  default_buy_rate: number
  default_sell_rate: number
}

export default function ExchangeCorridorListPage() {
  const { t } = useTranslation()
  const { confirm, ConfirmDialog } = useConfirm()
  const [data, setData] = useState<ExchangeCorridor[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const isEdit = editingId !== null

  const { register, handleSubmit, reset, setValue, control, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  const currencyFields: Field[] = [
    { name: 'code', label: t('currency.code'), required: true },
    { name: 'name', label: t('currency.name'), required: true },
    { name: 'symbol', label: t('currency.symbol'), required: true },
    { name: 'decimals', label: t('currency.decimals'), type: 'number', required: true },
    { name: 'is_crypto', label: t('currency.is_crypto'), type: 'select', options: [{ value: 1, label: 'Yes' }, { value: 0, label: 'No' }], defaultValue: 0 },
  ]

  const fetch = () => {
    setLoading(true)
    exchangeCorridorRepository.all().then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => {
    setEditingId(null)
    currencyRepository.all().then(setCurrencies)
    reset({ origin_currency_id: 0, destination_currency_id: 0, name: '', is_active: true, default_buy_rate: 0, default_sell_rate: 0 })
    setModalOpen(true)
  }

  const openEdit = async (id: number) => {
    setEditingId(id)
    try {
      const [item, curs] = await Promise.all([
        exchangeCorridorRepository.find(id),
        currencyRepository.all(),
      ])
      setCurrencies(curs)
      reset({
        origin_currency_id: item.origin_currency_id,
        destination_currency_id: item.destination_currency_id,
        name: item.name,
        is_active: item.is_active,
        default_buy_rate: parseFloat(item.default_buy_rate),
        default_sell_rate: parseFloat(item.default_sell_rate),
      })
      setModalOpen(true)
    } catch {
      toast.error('Error al cargar corredor')
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await exchangeCorridorRepository.update(editingId!, data)
      } else {
        await exchangeCorridorRepository.create(data)
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
      await exchangeCorridorRepository.delete(id)
      toast.success('Eliminado exitosamente')
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleBulkDelete = async (ids: number[]) => {
    if (!await confirm(`¿Eliminar ${ids.length} registro(s)?`)) return
    try {
      await Promise.all(ids.map((id) => exchangeCorridorRepository.delete(id)))
      toast.success(`${ids.length} registro(s) eliminado(s)`)
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('exchange_corridor.title')}</h1>
      <DataTable<ExchangeCorridor>
        columns={[
          { key: 'name', label: t('exchange_corridor.name') },
          { key: 'default_buy_rate', label: t('exchange_corridor.default_buy_rate'), render: (item) => fmt(item.default_buy_rate, 4) },
          { key: 'default_sell_rate', label: t('exchange_corridor.default_sell_rate'), render: (item) => fmt(item.default_sell_rate, 4) },
          { key: 'is_active', label: t('common.status'), render: (item) => item.is_active ? t('common.active') : t('common.inactive') },
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t(isEdit ? 'exchange_corridor.edit' : 'exchange_corridor.create')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label={t('exchange_corridor.name')} error={errors.name?.message} required>
            <input {...register('name', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.name} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('exchange_corridor.origin_currency')} error={errors.origin_currency_id?.message} required>
              <div className="flex gap-2">
                <select {...register('origin_currency_id', { required: 'Required', valueAsNumber: true })} className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.origin_currency_id}>
                  <option value="">Select...</option>
                  {currencies.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
                <InlineCreateModal
                  onCreate={(form) => currencyRepository.create(form)}
                  fields={currencyFields}
                  title={t('currency.create')}
                  onCreated={(item) => {
                    setCurrencies((prev) => [...prev, item])
                    setValue('origin_currency_id', item.id)
                  }}
                />
              </div>
            </FormField>
            <FormField label={t('exchange_corridor.destination_currency')} error={errors.destination_currency_id?.message} required>
              <div className="flex gap-2">
                <select {...register('destination_currency_id', { required: 'Required', valueAsNumber: true })} className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.destination_currency_id}>
                  <option value="">Select...</option>
                  {currencies.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
                <InlineCreateModal
                  onCreate={(form) => currencyRepository.create(form)}
                  fields={currencyFields}
                  title={t('currency.create')}
                  onCreated={(item) => {
                    setCurrencies((prev) => [...prev, item])
                    setValue('destination_currency_id', item.id)
                  }}
                />
              </div>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('exchange_corridor.default_buy_rate')} error={errors.default_buy_rate?.message}>
              <Controller name="default_buy_rate" control={control} render={({field}) => <NumberInput {...field} decimals={4} aria-invalid={!!errors.default_buy_rate} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />} />
            </FormField>
            <FormField label={t('exchange_corridor.default_sell_rate')} error={errors.default_sell_rate?.message}>
              <Controller name="default_sell_rate" control={control} render={({field}) => <NumberInput {...field} decimals={4} aria-invalid={!!errors.default_sell_rate} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />} />
            </FormField>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('is_active')} className="rounded" />
              <span className="text-sm font-medium text-gray-700">{t('common.active')}</span>
            </label>
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

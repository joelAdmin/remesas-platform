import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'
import { profitSharingRuleRepository } from '../../services/repositories/ProfitSharingRuleRepository'
import { exchangeCorridorRepository } from '../../services/repositories/ExchangeCorridorRepository'
import { currencyRepository } from '../../services/repositories/CurrencyRepository'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import NumberInput from '../../components/ui/NumberInput'
import { FormField } from '../../components/ui/FormField'
import { useConfirm } from '../../components/ui/ConfirmDialog'
import { handleFormErrors } from '../../lib/formUtils'
import { fmt } from '../../lib/utils'
import type { ProfitSharingRule, ExchangeCorridor, Currency } from '../../types/entities'

interface FormData {
  exchange_corridor_id: number
  partner_name: string
  percent: number
  bonus_fixed: number
  bonus_currency_id: number | null
  is_active: boolean
}

export default function ProfitSharingRuleListPage() {
  const { t } = useTranslation()
  const { confirm, ConfirmDialog } = useConfirm()
  const [data, setData] = useState<ProfitSharingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [corridors, setCorridors] = useState<ExchangeCorridor[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const isEdit = editingId !== null

  const { register, handleSubmit, reset, control, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  const fetch = () => {
    setLoading(true)
    profitSharingRuleRepository.all().then(setData).finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [])

  const openCreate = () => {
    setEditingId(null)
    Promise.all([exchangeCorridorRepository.all(), currencyRepository.all()]).then(([cors, curs]) => {
      setCorridors(cors)
      setCurrencies(curs)
    })
    reset({ exchange_corridor_id: 0, partner_name: '', percent: 0, bonus_fixed: 0, bonus_currency_id: null, is_active: true })
    setModalOpen(true)
  }

  const openEdit = async (id: number) => {
    setEditingId(id)
    try {
      const [item, cors, curs] = await Promise.all([
        profitSharingRuleRepository.find(id),
        exchangeCorridorRepository.all(),
        currencyRepository.all(),
      ])
      setCorridors(cors)
      setCurrencies(curs)
      reset({
        exchange_corridor_id: item.exchange_corridor_id,
        partner_name: item.partner_name,
        percent: parseFloat(item.percent),
        bonus_fixed: parseFloat(item.bonus_fixed),
        bonus_currency_id: item.bonus_currency_id,
        is_active: item.is_active,
      })
      setModalOpen(true)
    } catch {
      toast.error('Error al cargar regla')
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) await profitSharingRuleRepository.update(editingId!, data)
      else await profitSharingRuleRepository.create(data)
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
      await profitSharingRuleRepository.delete(id)
      toast.success('Eliminado exitosamente')
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleBulkDelete = async (ids: number[]) => {
    if (!await confirm(`¿Eliminar ${ids.length} registro(s)?`)) return
    try {
      await Promise.all(ids.map((id) => profitSharingRuleRepository.delete(id)))
      toast.success(`${ids.length} registro(s) eliminado(s)`)
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('nav.profit_sharing_rules')}</h1>
      <DataTable<ProfitSharingRule>
        columns={[
          { key: 'partner_name', label: t('profit_sharing_rule.partner') },
          { key: 'percent', label: '%', render: (item) => `${fmt(item.percent)}%` },
          { key: 'bonus_fixed', label: t('profit_sharing_rule.bonus_fixed'), render: (item) => fmt(item.bonus_fixed) },
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t(isEdit ? 'profit_sharing_rule.edit' : 'profit_sharing_rule.create')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label={t('exchange_corridor.title')} error={errors.exchange_corridor_id?.message} required>
            <select {...register('exchange_corridor_id', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.exchange_corridor_id}>
              <option value="">Select...</option>
              {corridors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('profit_sharing_rule.partner')} error={errors.partner_name?.message} required>
              <input {...register('partner_name', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.partner_name} />
            </FormField>
            <FormField label={t('profit_sharing_rule.percent')} error={errors.percent?.message}>
              <Controller name="percent" control={control} render={({field}) => <NumberInput {...field} decimals={2} aria-invalid={!!errors.percent} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('profit_sharing_rule.bonus_fixed')} error={errors.bonus_fixed?.message}>
              <Controller name="bonus_fixed" control={control} render={({field}) => <NumberInput {...field} decimals={2} aria-invalid={!!errors.bonus_fixed} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />} />
            </FormField>
            <FormField label={t('profit_sharing_rule.bonus_currency')}>
              <select {...register('bonus_currency_id', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.bonus_currency_id}>
                <option value="">None</option>
                {currencies.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
              </select>
            </FormField>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('is_active')} className="rounded" />
              <span className="text-sm font-medium text-gray-700">{t('common.active')}</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{t('common.save')}</button>
            <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

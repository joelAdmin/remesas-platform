import { useForm, Controller } from 'react-hook-form'
import NumberInput from '../../components/ui/NumberInput'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { profitSharingRuleRepository } from '../../services/repositories/ProfitSharingRuleRepository'
import { exchangeCorridorRepository } from '../../services/repositories/ExchangeCorridorRepository'
import { currencyRepository } from '../../services/repositories/CurrencyRepository'
import { FormField } from '../../components/ui/FormField'
import { handleFormErrors } from '../../lib/formUtils'
import type { ExchangeCorridor, Currency } from '../../types/entities'

interface FormData {
  exchange_corridor_id: number
  partner_name: string
  percent: number
  bonus_fixed: number
  bonus_currency_id: number | null
  is_active: boolean
}

export default function ProfitSharingRuleFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [corridors, setCorridors] = useState<ExchangeCorridor[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])

  const { register, handleSubmit, reset, control, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  useEffect(() => {
    Promise.all([exchangeCorridorRepository.all(), currencyRepository.all()]).then(([corridors, currencies]) => {
      setCorridors(corridors)
      setCurrencies(currencies)
    })
    if (isEdit && id) {
      profitSharingRuleRepository.find(Number(id)).then((d) => {
        reset({
          exchange_corridor_id: d.exchange_corridor_id,
          partner_name: d.partner_name,
          percent: parseFloat(d.percent),
          bonus_fixed: parseFloat(d.bonus_fixed),
          bonus_currency_id: d.bonus_currency_id,
          is_active: d.is_active,
        })
      })
    }
  }, [id, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) await profitSharingRuleRepository.update(Number(id), data)
      else await profitSharingRuleRepository.create(data)
      toast.success('Guardado exitosamente')
      navigate('/profit-sharing-rules')
    } catch (err) {
      if (!handleFormErrors(err, setError)) {
        toast.error('Error al guardar')
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t(isEdit ? 'profit_sharing_rule.edit' : 'profit_sharing_rule.create')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
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
          <button type="button" onClick={() => navigate('/profit-sharing-rules')} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
        </div>
      </form>
    </div>
  )
}

import { useForm, Controller } from 'react-hook-form'
import NumberInput from '../../components/ui/NumberInput'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { commissionRuleRepository } from '../../services/repositories/CommissionRuleRepository'
import { exchangeCorridorRepository } from '../../services/repositories/ExchangeCorridorRepository'
import { currencyRepository } from '../../services/repositories/CurrencyRepository'
import { FormField } from '../../components/ui/FormField'
import { handleFormErrors } from '../../lib/formUtils'
import type { ExchangeCorridor, Currency } from '../../types/entities'

interface FormData {
  exchange_corridor_id: number
  commission_type: 'buy_commission' | 'destination_commission'
  percent: number
  fixed_amount: number
  fixed_currency_id: number | null
  applies_to: 'origin' | 'destination'
  is_active: boolean
}

export default function CommissionRuleFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [corridors, setCorridors] = useState<ExchangeCorridor[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])

  const { register, handleSubmit, reset, control, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  useEffect(() => {
    Promise.all([
      exchangeCorridorRepository.all(),
      currencyRepository.all(),
    ]).then(([corridors, currencies]) => {
      setCorridors(corridors)
      setCurrencies(currencies)
    })
    if (isEdit && id) {
      commissionRuleRepository.find(Number(id)).then((d) => {
        reset({
          exchange_corridor_id: d.exchange_corridor_id,
          commission_type: d.commission_type as any,
          percent: parseFloat(d.percent),
          fixed_amount: parseFloat(d.fixed_amount),
          fixed_currency_id: d.fixed_currency_id,
          applies_to: d.applies_to as any,
          is_active: d.is_active,
        })
      })
    }
  }, [id, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await commissionRuleRepository.update(Number(id), data)
      } else {
        await commissionRuleRepository.create(data)
      }
      toast.success('Guardado exitosamente')
      navigate('/commission-rules')
    } catch (err) {
      if (!handleFormErrors(err, setError)) {
        toast.error('Error al guardar')
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t(isEdit ? 'commission_rule.edit' : 'commission_rule.create')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <FormField label={t('exchange_corridor.title')} error={errors.exchange_corridor_id?.message} required>
          <select {...register('exchange_corridor_id', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.exchange_corridor_id}>
            <option value="">Select...</option>
            {corridors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('commission_rule.type')} error={errors.commission_type?.message} required>
            <select {...register('commission_type', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.commission_type}>
              <option value="buy_commission">Buy Commission</option>
              <option value="destination_commission">Destination Commission</option>
            </select>
          </FormField>
          <FormField label={t('commission_rule.applies_to')} error={errors.applies_to?.message} required>
            <select {...register('applies_to', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.applies_to}>
              <option value="origin">{t('remittance.origin_amount')}</option>
              <option value="destination">{t('remittance.destination_net')}</option>
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('commission_rule.percent')} error={errors.percent?.message}>
            <Controller name="percent" control={control} render={({field}) => <NumberInput {...field} decimals={2} aria-invalid={!!errors.percent} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />} />
          </FormField>
          <FormField label={t('commission_rule.fixed_amount')} error={errors.fixed_amount?.message}>
            <Controller name="fixed_amount" control={control} render={({field}) => <NumberInput {...field} decimals={2} aria-invalid={!!errors.fixed_amount} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />} />
          </FormField>
        </div>
        <FormField label={t('commission_rule.fixed_currency')}>
          <select {...register('fixed_currency_id', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.fixed_currency_id}>
            <option value="">None</option>
            {currencies.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
          </select>
        </FormField>
        <div>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('is_active')} className="rounded" />
            <span className="text-sm font-medium text-gray-700">{t('common.active')}</span>
          </label>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{t('common.save')}</button>
          <button type="button" onClick={() => navigate('/commission-rules')} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
        </div>
      </form>
    </div>
  )
}

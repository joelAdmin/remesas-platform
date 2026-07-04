import { useForm, Controller } from 'react-hook-form'
import NumberInput from '../../components/ui/NumberInput'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { exchangeCorridorRepository } from '../../services/repositories/ExchangeCorridorRepository'
import { currencyRepository } from '../../services/repositories/CurrencyRepository'
import InlineCreateModal from '../../components/ui/InlineCreateModal'
import { FormField } from '../../components/ui/FormField'
import { handleFormErrors } from '../../lib/formUtils'
import type { Currency } from '../../types/entities'
import type { Field } from '../../components/ui/InlineCreateModal'

interface FormData {
  origin_currency_id: number
  destination_currency_id: number
  name: string
  is_active: boolean
  default_buy_rate: number
  default_sell_rate: number
}

export default function ExchangeCorridorFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [currencies, setCurrencies] = useState<Currency[]>([])

  const { register, handleSubmit, reset, setValue, control, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  const currencyFields: Field[] = [
    { name: 'code', label: t('currency.code'), required: true },
    { name: 'name', label: t('currency.name'), required: true },
    { name: 'symbol', label: t('currency.symbol'), required: true },
    { name: 'decimals', label: t('currency.decimals'), type: 'number', required: true },
    { name: 'is_crypto', label: t('currency.is_crypto'), type: 'select', options: [{ value: 1, label: 'Yes' }, { value: 0, label: 'No' }], defaultValue: 0 },
  ]

  useEffect(() => {
    currencyRepository.all().then(setCurrencies)
    if (isEdit && id) {
      exchangeCorridorRepository.find(Number(id)).then((d) => {
        reset({
          origin_currency_id: d.origin_currency_id,
          destination_currency_id: d.destination_currency_id,
          name: d.name,
          is_active: d.is_active,
          default_buy_rate: parseFloat(d.default_buy_rate),
          default_sell_rate: parseFloat(d.default_sell_rate),
        })
      })
    }
  }, [id, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await exchangeCorridorRepository.update(Number(id), data)
      } else {
        await exchangeCorridorRepository.create(data)
      }
      toast.success('Guardado exitosamente')
      navigate('/exchange-corridors')
    } catch (err) {
      if (!handleFormErrors(err, setError)) {
        toast.error('Error al guardar')
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t(isEdit ? 'exchange_corridor.edit' : 'exchange_corridor.create')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
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
          <button type="button" onClick={() => navigate('/exchange-corridors')} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}

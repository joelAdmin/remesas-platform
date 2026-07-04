import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { currencyRepository } from '../../services/repositories/CurrencyRepository'
import { FormField } from '../../components/ui/FormField'
import { handleFormErrors } from '../../lib/formUtils'

interface FormData {
  code: string
  name: string
  symbol: string
  decimals: number
  is_crypto: boolean
}

export default function CurrencyFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  useEffect(() => {
    if (isEdit && id) {
      currencyRepository.find(Number(id)).then((d) => {
        reset({ code: d.code, name: d.name, symbol: d.symbol, decimals: d.decimals, is_crypto: d.is_crypto })
      })
    }
  }, [id, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await currencyRepository.update(Number(id), data)
      } else {
        await currencyRepository.create(data)
      }
      toast.success('Guardado exitosamente')
      navigate('/currencies')
    } catch (err) {
      if (!handleFormErrors(err, setError)) {
        toast.error('Error al guardar')
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t(isEdit ? 'currency.edit' : 'currency.create')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
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
            <input type="number" {...register('decimals', { required: 'Required', min: 0, max: 8 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.decimals} />
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
          <button type="button" onClick={() => navigate('/currencies')} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}

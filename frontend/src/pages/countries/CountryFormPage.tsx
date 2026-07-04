import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { countryRepository } from '../../services/repositories/CountryRepository'
import { FormField } from '../../components/ui/FormField'
import { handleFormErrors } from '../../lib/formUtils'
import { toast } from 'sonner'

interface FormData {
  name: string
  currency_code: string
  currency_symbol: string
  phone_code: string
  flag_icon?: string
}

export default function CountryFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  useEffect(() => {
    if (isEdit && id) {
      countryRepository.find(Number(id)).then((d) => {
        reset({ name: d.name, currency_code: d.currency_code, currency_symbol: d.currency_symbol, phone_code: d.phone_code, flag_icon: d.flag_icon || '' })
      })
    }
  }, [id, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      if (isEdit) {
        await countryRepository.update(Number(id), data)
      } else {
        await countryRepository.create(data)
      }
      navigate('/countries')
    } catch (err) {
      if (!handleFormErrors(err, setError)) {
        toast.error('Error al guardar')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t(isEdit ? 'country.edit' : 'country.create')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <FormField label={t('country.name')} error={errors.name?.message} required>
            <input {...register('name', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.name} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('country.currency_code')} error={errors.currency_code?.message} required>
              <input {...register('currency_code', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.currency_code} />
            </FormField>
            <FormField label={t('country.currency_symbol')} error={errors.currency_symbol?.message} required>
              <input {...register('currency_symbol', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.currency_symbol} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('country.phone_code')} error={errors.phone_code?.message} required>
              <input {...register('phone_code', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.phone_code} />
            </FormField>
            <FormField label={t('country.flag_icon')} error={errors.flag_icon?.message}>
              <input {...register('flag_icon')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.flag_icon} />
            </FormField>
          </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting || loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {t('common.save')}
          </button>
          <button type="button" onClick={() => navigate('/countries')} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}

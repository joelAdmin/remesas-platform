import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { workCycleRepository } from '../../services/repositories/WorkCycleRepository'
import { FormField } from '../../components/ui/FormField'
import { handleFormErrors } from '../../lib/formUtils'

interface FormData {
  name: string
  start_date: string
  notes: string
}

export default function WorkCycleFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  useEffect(() => {
    if (isEdit && id) {
      workCycleRepository.find(Number(id)).then((d) => {
        reset({
          name: d.name,
          start_date: d.start_date,
          notes: d.notes ?? '',
        })
      })
    }
  }, [id, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) await workCycleRepository.update(Number(id), data)
      else await workCycleRepository.create(data)
      toast.success('Guardado exitosamente')
      navigate('/work-cycles')
    } catch (err) {
      if (!handleFormErrors(err, setError)) toast.error('Error al guardar')
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t(isEdit ? 'work_cycle.edit' : 'work_cycle.create')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <FormField label={t('work_cycle.name')} error={errors.name?.message} required>
          <input {...register('name', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.name} />
        </FormField>
        <FormField label={t('work_cycle.start_date')} error={errors.start_date?.message} required>
          <input type="date" {...register('start_date', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.start_date} />
        </FormField>
        <FormField label={t('work_cycle.notes')}>
          <textarea {...register('notes')} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </FormField>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{t('common.save')}</button>
          <button type="button" onClick={() => navigate('/work-cycles')} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
        </div>
      </form>
    </div>
  )
}

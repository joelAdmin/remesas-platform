import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { userRepository } from '../../services/repositories/UserRepository'
import { FormField } from '../../components/ui/FormField'
import { handleFormErrors } from '../../lib/formUtils'

interface FormData {
  name: string
  email: string
  password: string
  role: string
}

export default function UserFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  useEffect(() => {
    if (isEdit && id) {
      userRepository.find(Number(id)).then((d) => {
        reset({ name: d.name, email: d.email, password: '', role: d.role })
      })
    }
  }, [id, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data }
      if (isEdit && !payload.password) { delete (payload as Record<string, any>).password }

      if (isEdit) {
        await userRepository.update(Number(id), payload)
      } else {
        await userRepository.create(payload)
      }
      toast.success('Guardado exitosamente')
      navigate('/users')
    } catch (err) {
      if (!handleFormErrors(err, setError)) {
        toast.error('Error al guardar')
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t(isEdit ? 'user.edit' : 'user.create')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <FormField label={t('user.name')} error={errors.name?.message} required>
          <input {...register('name', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.name} />
        </FormField>
        <FormField label={t('user.email')} error={errors.email?.message} required>
          <input type="email" {...register('email', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.email} />
        </FormField>
        <FormField label={t('user.password') + (isEdit ? ' (leave empty to keep)' : '')} error={errors.password?.message} required={!isEdit}>
          <input type="password" {...register('password', { required: !isEdit ? 'Required' : false })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.password} />
        </FormField>
        <FormField label={t('user.role')} error={errors.role?.message} required>
          <select {...register('role', { required: 'Required' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.role}>
            <option value="admin">{t('user.roles.admin')}</option>
            <option value="operator">{t('user.roles.operator')}</option>
            <option value="promoter">{t('user.roles.promoter')}</option>
          </select>
        </FormField>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {t('common.save')}
          </button>
          <button type="button" onClick={() => navigate('/users')} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}

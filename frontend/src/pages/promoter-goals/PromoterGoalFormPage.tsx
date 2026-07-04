import { useForm, Controller } from 'react-hook-form'
import NumberInput from '../../components/ui/NumberInput'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { promoterGoalRepository } from '../../services/repositories/PromoterGoalRepository'
import { userRepository } from '../../services/repositories/UserRepository'
import { FormField } from '../../components/ui/FormField'
import { handleFormErrors } from '../../lib/formUtils'
import type { User } from '../../types/auth'

interface FormData {
  user_id: number
  year: number
  month: number
  goal_amount_usd: number
  achieved_amount_usd: number | null
  bonus_percent: number | null
  status: string
}

export default function PromoterGoalFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [users, setUsers] = useState<User[]>([])

  const { register, handleSubmit, reset, control, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  useEffect(() => {
    userRepository.all().then(setUsers)
    if (isEdit && id) {
      promoterGoalRepository.find(Number(id)).then((d) => {
        reset({
          user_id: d.user_id,
          year: d.year,
          month: d.month,
          goal_amount_usd: parseFloat(d.goal_amount_usd),
          achieved_amount_usd: d.achieved_amount_usd ? parseFloat(d.achieved_amount_usd) : null,
          bonus_percent: d.bonus_percent ? parseFloat(d.bonus_percent) : null,
          status: d.status || 'pending',
        })
      })
    }
  }, [id, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) await promoterGoalRepository.update(Number(id), data)
      else await promoterGoalRepository.create(data)
      toast.success('Guardado exitosamente')
      navigate('/promoter-goals')
    } catch (err) {
      if (!handleFormErrors(err, setError)) {
        toast.error('Error al guardar')
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t(isEdit ? 'promoter_goal.edit' : 'promoter_goal.create')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <FormField label={t('user.title')} error={errors.user_id?.message} required>
          <select {...register('user_id', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.user_id}>
            <option value="">Select...</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('promoter_goal.year')} error={errors.year?.message} required>
            <input type="number" {...register('year', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.year} />
          </FormField>
          <FormField label={t('promoter_goal.month')} error={errors.month?.message} required>
            <select {...register('month', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.month}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('promoter_goal.goal_amount')} error={errors.goal_amount_usd?.message}>
            <Controller name="goal_amount_usd" control={control} render={({field}) => <NumberInput {...field} decimals={2} aria-invalid={!!errors.goal_amount_usd} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />} />
          </FormField>
          <FormField label={t('promoter_goal.achieved')} error={errors.achieved_amount_usd?.message}>
            <Controller name="achieved_amount_usd" control={control} render={({field}) => <NumberInput {...field} decimals={2} aria-invalid={!!errors.achieved_amount_usd} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('promoter_goal.bonus_percent')} error={errors.bonus_percent?.message}>
            <Controller name="bonus_percent" control={control} render={({field}) => <NumberInput {...field} decimals={2} aria-invalid={!!errors.bonus_percent} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />} />
          </FormField>
          <FormField label={t('common.status')} error={errors.status?.message}>
            <select {...register('status')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.status}>
              <option value="pending">{t('common.pending')}</option>
              <option value="achieved">Achieved</option>
              <option value="missed">Missed</option>
            </select>
          </FormField>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{t('common.save')}</button>
          <button type="button" onClick={() => navigate('/promoter-goals')} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
        </div>
      </form>
    </div>
  )
}

import { useForm, Controller } from 'react-hook-form'
import NumberInput from '../../components/ui/NumberInput'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { fmt } from '../../lib/utils'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { promoterCommissionRepository } from '../../services/repositories/PromoterCommissionRepository'
import { promoterGoalRepository } from '../../services/repositories/PromoterGoalRepository'
import { FormField } from '../../components/ui/FormField'
import { handleFormErrors } from '../../lib/formUtils'
import type { PromoterGoal } from '../../types/entities'

interface FormData {
  promoter_goal_id: number
  commission_rate_override: number
  valid_from: string
  valid_until: string
}

export default function PromoterCommissionFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [goals, setGoals] = useState<PromoterGoal[]>([])

  const { register, handleSubmit, reset, control, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  useEffect(() => {
    promoterGoalRepository.all().then(setGoals)
    if (isEdit && id) {
      promoterCommissionRepository.find(Number(id)).then((d) => {
        reset({
          promoter_goal_id: d.promoter_goal_id,
          commission_rate_override: parseFloat(d.commission_rate_override),
          valid_from: d.valid_from || '',
          valid_until: d.valid_until || '',
        })
      })
    }
  }, [id, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data }
      if (!payload.valid_from) delete (payload as any).valid_from
      if (!payload.valid_until) delete (payload as any).valid_until
      if (isEdit) await promoterCommissionRepository.update(Number(id), payload)
      else await promoterCommissionRepository.create(payload)
      toast.success('Guardado exitosamente')
      navigate('/promoter-commissions')
    } catch (err) {
      if (!handleFormErrors(err, setError)) {
        toast.error('Error al guardar')
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t(isEdit ? 'promoter_commission.edit' : 'promoter_commission.create')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <FormField label={t('promoter_goal.title')} error={errors.promoter_goal_id?.message} required>
          <select {...register('promoter_goal_id', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.promoter_goal_id}>
            <option value="">Select...</option>
            {goals.map((g) => <option key={g.id} value={g.id}>Goal #{g.id} - {g.month}/{g.year} (${fmt(g.goal_amount_usd, 0)})</option>)}
          </select>
        </FormField>
        <FormField label={t('promoter_commission.rate')} error={errors.commission_rate_override?.message}>
          <Controller name="commission_rate_override" control={control} render={({field}) => <NumberInput {...field} decimals={2} aria-invalid={!!errors.commission_rate_override} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('promoter_commission.valid_from')} error={errors.valid_from?.message}>
            <input type="date" {...register('valid_from')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.valid_from} />
          </FormField>
          <FormField label={t('promoter_commission.valid_until')} error={errors.valid_until?.message}>
            <input type="date" {...register('valid_until')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" aria-invalid={!!errors.valid_until} />
          </FormField>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{t('common.save')}</button>
          <button type="button" onClick={() => navigate('/promoter-commissions')} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
        </div>
      </form>
    </div>
  )
}

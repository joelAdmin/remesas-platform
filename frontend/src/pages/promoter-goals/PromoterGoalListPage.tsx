import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'
import { promoterGoalRepository } from '../../services/repositories/PromoterGoalRepository'
import { userRepository } from '../../services/repositories/UserRepository'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import NumberInput from '../../components/ui/NumberInput'
import { FormField } from '../../components/ui/FormField'
import { useConfirm } from '../../components/ui/ConfirmDialog'
import { handleFormErrors } from '../../lib/formUtils'
import { fmt } from '../../lib/utils'
import type { PromoterGoal } from '../../types/entities'
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

export default function PromoterGoalListPage() {
  const { t } = useTranslation()
  const { confirm, ConfirmDialog } = useConfirm()
  const [data, setData] = useState<PromoterGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const isEdit = editingId !== null

  const { register, handleSubmit, reset, control, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  const fetch = () => {
    setLoading(true)
    promoterGoalRepository.all().then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => {
    setEditingId(null)
    userRepository.all().then(setUsers)
    reset({ user_id: 0, year: new Date().getFullYear(), month: new Date().getMonth() + 1, goal_amount_usd: 0, achieved_amount_usd: null, bonus_percent: null, status: 'pending' })
    setModalOpen(true)
  }

  const openEdit = async (id: number) => {
    setEditingId(id)
    try {
      const [item, us] = await Promise.all([
        promoterGoalRepository.find(id),
        userRepository.all(),
      ])
      setUsers(us)
      reset({
        user_id: item.user_id,
        year: item.year,
        month: item.month,
        goal_amount_usd: parseFloat(item.goal_amount_usd),
        achieved_amount_usd: item.achieved_amount_usd ? parseFloat(item.achieved_amount_usd) : null,
        bonus_percent: item.bonus_percent ? parseFloat(item.bonus_percent) : null,
        status: item.status || 'pending',
      })
      setModalOpen(true)
    } catch {
      toast.error('Error al cargar meta')
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) await promoterGoalRepository.update(editingId!, data)
      else await promoterGoalRepository.create(data)
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
      await promoterGoalRepository.delete(id)
      toast.success('Eliminado exitosamente')
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleBulkDelete = async (ids: number[]) => {
    if (!await confirm(`¿Eliminar ${ids.length} registro(s)?`)) return
    try {
      await Promise.all(ids.map((id) => promoterGoalRepository.delete(id)))
      toast.success(`${ids.length} registro(s) eliminado(s)`)
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('nav.promoter_goals')}</h1>
      <DataTable<PromoterGoal>
        columns={[
          { key: 'user_id', label: 'User ID' },
          { key: 'year', label: t('promoter_goal.year') },
          { key: 'month', label: t('promoter_goal.month') },
          { key: 'goal_amount_usd', label: t('promoter_goal.goal_amount'), render: (item) => `$${fmt(item.goal_amount_usd, 0)}` },
          { key: 'achieved_amount_usd', label: t('promoter_goal.achieved'), render: (item) => item.achieved_amount_usd ? `$${fmt(item.achieved_amount_usd, 0)}` : '-' },
          { key: 'status', label: t('common.status') },
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t(isEdit ? 'promoter_goal.edit' : 'promoter_goal.create')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

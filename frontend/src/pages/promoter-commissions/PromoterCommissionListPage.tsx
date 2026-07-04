import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'
import { promoterCommissionRepository } from '../../services/repositories/PromoterCommissionRepository'
import { promoterGoalRepository } from '../../services/repositories/PromoterGoalRepository'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import NumberInput from '../../components/ui/NumberInput'
import { FormField } from '../../components/ui/FormField'
import { useConfirm } from '../../components/ui/ConfirmDialog'
import { handleFormErrors } from '../../lib/formUtils'
import { fmt } from '../../lib/utils'
import type { PromoterCommission, PromoterGoal } from '../../types/entities'

interface FormData {
  promoter_goal_id: number
  commission_rate_override: number
  valid_from: string
  valid_until: string
}

export default function PromoterCommissionListPage() {
  const { t } = useTranslation()
  const { confirm, ConfirmDialog } = useConfirm()
  const [data, setData] = useState<PromoterCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [goals, setGoals] = useState<PromoterGoal[]>([])
  const isEdit = editingId !== null

  const { register, handleSubmit, reset, control, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  const fetch = () => {
    setLoading(true)
    promoterCommissionRepository.all().then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => {
    setEditingId(null)
    promoterGoalRepository.all().then(setGoals)
    reset({ promoter_goal_id: 0, commission_rate_override: 0, valid_from: '', valid_until: '' })
    setModalOpen(true)
  }

  const openEdit = async (id: number) => {
    setEditingId(id)
    try {
      const [item, gs] = await Promise.all([
        promoterCommissionRepository.find(id),
        promoterGoalRepository.all(),
      ])
      setGoals(gs)
      reset({
        promoter_goal_id: item.promoter_goal_id,
        commission_rate_override: parseFloat(item.commission_rate_override),
        valid_from: item.valid_from || '',
        valid_until: item.valid_until || '',
      })
      setModalOpen(true)
    } catch {
      toast.error('Error al cargar comisión')
    }
  }

  const onSubmit = async (data: FormData) => {
    const payload = { ...data }
    if (!payload.valid_from) delete (payload as any).valid_from
    if (!payload.valid_until) delete (payload as any).valid_until
    try {
      if (isEdit) await promoterCommissionRepository.update(editingId!, payload)
      else await promoterCommissionRepository.create(payload)
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
      await promoterCommissionRepository.delete(id)
      toast.success('Eliminado exitosamente')
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleBulkDelete = async (ids: number[]) => {
    if (!await confirm(`¿Eliminar ${ids.length} registro(s)?`)) return
    try {
      await Promise.all(ids.map((id) => promoterCommissionRepository.delete(id)))
      toast.success(`${ids.length} registro(s) eliminado(s)`)
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('nav.promoter_commissions')}</h1>
      <DataTable<PromoterCommission>
        columns={[
          { key: 'promoter_goal_id', label: 'Goal ID' },
          { key: 'commission_rate_override', label: t('promoter_commission.rate'), render: (item) => `${fmt(item.commission_rate_override)}%` },
          { key: 'valid_from', label: t('promoter_commission.valid_from'), render: (item) => item.valid_from || '-' },
          { key: 'valid_until', label: t('promoter_commission.valid_until'), render: (item) => item.valid_until || '-' },
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t(isEdit ? 'promoter_commission.edit' : 'promoter_commission.create')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { workCycleRepository } from '../../services/repositories/WorkCycleRepository'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { FormField } from '../../components/ui/FormField'
import { useConfirm } from '../../components/ui/ConfirmDialog'
import { handleFormErrors } from '../../lib/formUtils'
import type { WorkCycle } from '../../types/entities'

interface FormData {
  name: string
  start_date: string
  notes: string
}

export default function WorkCycleListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { confirm, ConfirmDialog } = useConfirm()
  const [data, setData] = useState<WorkCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const isEdit = editingId !== null

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  const fetch = () => {
    setLoading(true)
    Promise.all([
      workCycleRepository.all(),
      workCycleRepository.status(),
    ]).then(([cycles, status]) => {
      setData(cycles)
      setEnabled(status.enabled)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => {
    setEditingId(null)
    reset({ name: '', start_date: '', notes: '' })
    setModalOpen(true)
  }

  const openEdit = async (id: number) => {
    setEditingId(id)
    try {
      const item = await workCycleRepository.find(id)
      reset({ name: item.name, start_date: item.start_date, notes: item.notes ?? '' })
      setModalOpen(true)
    } catch {
      toast.error('Error al cargar ciclo')
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) await workCycleRepository.update(editingId!, data)
      else await workCycleRepository.create(data)
      toast.success('Guardado exitosamente')
      setModalOpen(false)
      fetch()
    } catch (err) {
      if (!handleFormErrors(err, setError)) toast.error('Error al guardar')
    }
  }

  const handleClose = async (id: number) => {
    if (!await confirm('¿Cerrar este ciclo? Se calcularán los totales automáticamente.', 'Cerrar')) return
    try {
      await workCycleRepository.close(id)
      toast.success('Ciclo cerrado exitosamente')
      fetch()
    } catch { toast.error('Error al cerrar ciclo') }
  }

  const handleReopen = async (id: number) => {
    if (!await confirm('¿Reabrir este ciclo?', 'Reabrir')) return
    try {
      await workCycleRepository.reopen(id)
      toast.success('Ciclo reabierto exitosamente')
      fetch()
    } catch { toast.error('Error al reabrir ciclo') }
  }

  const handleDelete = async (id: number) => {
    if (!await confirm(t('common.confirm_delete'))) return
    try {
      await workCycleRepository.delete(id)
      toast.success('Ciclo eliminado')
      fetch()
    } catch { toast.error('Error al eliminar ciclo') }
  }

  const handleToggle = async () => {
    try {
      await workCycleRepository.toggle(!enabled)
      setEnabled(!enabled)
      toast.success(enabled ? 'Trabajo por periodos desactivado' : 'Trabajo por periodos activado')
    } catch { toast.error('Error al cambiar configuración') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('nav.work_cycles')}</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <span>Activar periodos</span>
            <input type="checkbox" checked={enabled} onChange={handleToggle} className="rounded" />
          </label>
        </div>
      </div>

      {enabled && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg mb-4 text-sm">
          Trabajo por periodos activo. Las remesas se asignarán automáticamente al ciclo abierto.
        </div>
      )}

      <DataTable<WorkCycle>
        columns={[
          { key: 'name', label: t('work_cycle.name') },
          { key: 'status', label: t('common.status'), render: (item) => (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {item.status === 'open' ? 'Abierto' : 'Cerrado'}
            </span>
          )},
          { key: 'start_date', label: t('work_cycle.start_date') },
          { key: 'end_date', label: t('work_cycle.end_date'), render: (item) => item.end_date ?? '-' },
          { key: 'total_remittances', label: t('work_cycle.total_remittances'), render: (item) => item.total_remittances },
          { key: 'created_at', label: t('common.created_at'), render: (item) => item.created_at ?? '-' },
        ]}
        data={data}
        loading={loading}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        onBulkDelete={async (ids) => {
          if (!await confirm(`¿Eliminar ${ids.length} ciclo(s)?`)) return
          try {
            await Promise.all(ids.map((id) => workCycleRepository.delete(id)))
            toast.success(`${ids.length} ciclo(s) eliminado(s)`)
            fetch()
          } catch { toast.error('Error al eliminar') }
        }}
        keyExtractor={(item) => item.id}
        searchable
        renderActions={(item) => (
          <div className="flex items-center gap-2">
            {item.status === 'open' ? (
              <button onClick={() => handleClose(item.id)} className="text-sm text-orange-600 hover:text-orange-800 font-medium">
                Cerrar
              </button>
            ) : (
              <>
                <button onClick={() => handleReopen(item.id)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Reabrir
                </button>
                <button onClick={() => navigate(`/reports?work_cycle_id=${item.id}`)} className="text-sm text-green-600 hover:text-green-800 font-medium">
                  Reporte
                </button>
              </>
            )}
          </div>
        )}
      />
      <ConfirmDialog />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t(isEdit ? 'work_cycle.edit' : 'work_cycle.create')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">{t('common.cancel')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

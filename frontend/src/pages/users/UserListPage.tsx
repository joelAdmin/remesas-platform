import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { userRepository } from '../../services/repositories/UserRepository'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { FormField } from '../../components/ui/FormField'
import { useConfirm } from '../../components/ui/ConfirmDialog'
import { handleFormErrors } from '../../lib/formUtils'
import type { User } from '../../types/auth'

interface FormData {
  name: string
  email: string
  password: string
  role: string
}

export default function UserListPage() {
  const { t } = useTranslation()
  const { confirm, ConfirmDialog } = useConfirm()
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const isEdit = editingId !== null

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  const fetch = () => {
    setLoading(true)
    userRepository.all().then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => {
    setEditingId(null)
    reset({ name: '', email: '', password: '', role: 'operator' })
    setModalOpen(true)
  }

  const openEdit = async (id: number) => {
    setEditingId(id)
    try {
      const item = await userRepository.find(id)
      reset({ name: item.name, email: item.email, password: '', role: item.role })
      setModalOpen(true)
    } catch {
      toast.error('Error al cargar usuario')
    }
  }

  const onSubmit = async (data: FormData) => {
    const payload = { ...data }
    if (isEdit && !payload.password) delete (payload as Record<string, any>).password
    try {
      if (isEdit) {
        await userRepository.update(editingId!, payload)
      } else {
        await userRepository.create(payload)
      }
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
      await userRepository.delete(id)
      toast.success('Eliminado exitosamente')
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleBulkDelete = async (ids: number[]) => {
    if (!await confirm(`¿Eliminar ${ids.length} registro(s)?`)) return
    try {
      await Promise.all(ids.map((id) => userRepository.delete(id)))
      toast.success(`${ids.length} registro(s) eliminado(s)`)
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('user.title')}</h1>
      <DataTable<User>
        columns={[
          { key: 'name', label: t('user.name') },
          { key: 'email', label: t('user.email') },
          { key: 'role', label: t('user.role'), render: (item) => t(`user.roles.${item.role}`) },
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t(isEdit ? 'user.edit' : 'user.create')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

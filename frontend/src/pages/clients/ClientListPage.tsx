import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { clientRepository } from '../../services/repositories/ClientRepository'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { useConfirm } from '../../components/ui/ConfirmDialog'
import ClientFormPage from './ClientFormPage'
import type { Client } from '../../types/entities'
import { Plus } from 'lucide-react'

export default function ClientListPage() {
  const { t } = useTranslation()
  const { confirm, ConfirmDialog } = useConfirm()
  const [data, setData] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Client | null>(null)

  const fetch = () => {
    setLoading(true)
    clientRepository.all().then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => {
    setEditItem(null)
    setModalOpen(true)
  }

  const openEdit = (id: number) => {
    const item = data.find((d) => d.id === id)
    if (!item) return
    setEditItem(item)
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    setModalOpen(false)
    fetch()
  }

  const handleDelete = async (id: number) => {
    if (!await confirm(t('common.confirm_delete'))) return
    try {
      await clientRepository.delete(id)
      toast.success('Eliminado exitosamente')
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleBulkDelete = async (ids: number[]) => {
    if (!await confirm(`¿Eliminar ${ids.length} registro(s)?`)) return
    try {
      await Promise.all(ids.map((id) => clientRepository.delete(id)))
      toast.success(`${ids.length} registro(s) eliminado(s)`)
      fetch()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('client.title')}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all">
          <Plus size={18} /> {t('common.create')}
        </button>
      </div>

      <DataTable<Client>
        columns={[
          { key: 'full_name', label: t('client.full_name') },
          { key: 'document_number', label: t('client.document_number') },
          { key: 'phone', label: t('client.phone'), render: (item) => item.phone || '-' },
          { key: 'email', label: t('client.email'), render: (item) => item.email || '-' },
        ]}
        data={data}
        loading={loading}
        onEdit={(id) => { openEdit(id) }}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        keyExtractor={(item) => item.id}
        searchable
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t(editItem ? 'client.edit' : 'client.create')} size="md">
        <ClientFormPage
          clientId={editItem?.id}
          onSuccess={handleModalSuccess}
          showHeader={false}
        />
      </Modal>
      <ConfirmDialog />
    </div>
  )
}

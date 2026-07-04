import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { permissionRepository } from '../../services/repositories/PermissionRepository'
import type { Permission } from '../../types/entities'

const ROLES = ['admin', 'owner', 'operator', 'promoter']

export default function PermissionListPage() {
  const { t } = useTranslation()
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({})
  const [rolePermissions, setRolePermissions] = useState<Record<string, number[]>>({})
  const [activeRole, setActiveRole] = useState('admin')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      permissionRepository.all(),
      ...ROLES.map((r) =>
        permissionRepository.rolePermissions(r).then((ids) => ({ role: r, ids }))
      ),
    ]).then(([perms, ...roleResults]) => {
      setPermissions(perms)
      const rp: Record<string, number[]> = {}
      roleResults.forEach(({ role, ids }) => { rp[role] = ids })
      setRolePermissions(rp)
    }).finally(() => setLoading(false))
  }, [])

  const currentIds = rolePermissions[activeRole] ?? []
  const modules = Object.keys(permissions).sort()

  const toggle = (permId: number) => {
    setRolePermissions((prev) => {
      const ids = prev[activeRole] ?? []
      const next = ids.includes(permId)
        ? ids.filter((id) => id !== permId)
        : [...ids, permId]
      return { ...prev, [activeRole]: next }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await permissionRepository.updateRolePermissions(activeRole, rolePermissions[activeRole] ?? [])
      toast.success('Permisos actualizados')
    } catch {
      toast.error('Error al guardar permisos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('permissions.title')}</h1>

      <div className="flex gap-1 mb-6 border-b">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              activeRole === role
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t(`user.roles.${role}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : (
        <div className="space-y-6">
          {modules.map((module) => (
            <div key={module}>
              <h3 className="text-lg font-semibold text-gray-700 mb-2 capitalize border-b pb-1">
                {module === 'exchange-corridors'
                  ? t('nav.exchange_corridors')
                  : module === 'client-accounts'
                    ? 'Cuentas de Clientes'
                    : module === 'source-accounts'
                      ? 'Cuentas Origen'
                      : module === 'commission-rules'
                        ? t('nav.commission_rules')
                        : module === 'profit-sharing-rules'
                          ? t('nav.profit_sharing_rules')
                          : module === 'promoter-goals'
                            ? t('nav.promoter_goals')
                            : module === 'promoter-commissions'
                              ? t('nav.promoter_commissions')
                              : module === 'bank-accounts'
                                ? t('nav.bank_accounts')
                                : t(`nav.${module}`) || module}
              </h3>
              <div className="space-y-1">
                {permissions[module]?.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-3 px-3 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={currentIds.includes(perm.id)}
                      onChange={() => toggle(perm.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      )}
    </div>
  )
}

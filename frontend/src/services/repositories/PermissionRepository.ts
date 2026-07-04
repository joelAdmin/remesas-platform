import api from '../api'
import type { Permission } from '../../types/entities'

class PermissionRepository {
  async all(): Promise<Record<string, Permission[]>> {
    const { data } = await api.get('/permissions')
    return data.data as Record<string, Permission[]>
  }

  async rolePermissions(role: string): Promise<number[]> {
    const { data } = await api.get(`/permissions/role/${role}`)
    return data.data as number[]
  }

  async updateRolePermissions(role: string, permissionIds: number[]): Promise<void> {
    await api.put(`/permissions/role/${role}`, { permission_ids: permissionIds })
  }
}

export const permissionRepository = new PermissionRepository()

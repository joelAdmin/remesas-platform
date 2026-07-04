import api from '../api'
import type { PaginatedResponse } from '../../types/entities'

export function extractErrorMessage(err: any, fallback = 'Error'): string {
  return err.response?.data?.message
    || err.response?.data?.error
    || (err.response?.data?.errors
      ? Object.values(err.response.data.errors).flat().join('. ')
      : null)
    || err.message
    || fallback
}

export class BaseRepository<T extends { id: number }> {
  protected endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  async all(params?: Record<string, any>): Promise<T[]> {
    const response = await api.get(this.endpoint, { params })
    const data = response.data.data
    return Array.isArray(data) ? data : []
  }

  async paginated(params?: Record<string, any>): Promise<PaginatedResponse<T>> {
    const response = await api.get(this.endpoint, { params })
    return response.data as PaginatedResponse<T>
  }

  async find(id: number): Promise<T> {
    const response = await api.get(`${this.endpoint}/${id}`)
    return response.data.data as T
  }

  async create(data: Record<string, any>): Promise<T> {
    const response = await api.post(this.endpoint, data)
    return response.data.data as T
  }

  async update(id: number, data: Record<string, any>): Promise<T> {
    const response = await api.put(`${this.endpoint}/${id}`, data)
    return response.data.data as T
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.endpoint}/${id}`)
  }

  protected async post<TResponse>(path: string, data?: any): Promise<TResponse> {
    const response = await api.post(`${this.endpoint}${path}`, data)
    return response.data as TResponse
  }
}

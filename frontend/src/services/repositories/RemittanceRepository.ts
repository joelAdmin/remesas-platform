import { BaseRepository } from './BaseRepository'
import api from '../api'
import type { Remittance } from '../../types/entities'

class RemittanceRepository extends BaseRepository<Remittance> {
  constructor() { super('/remittances') }

  async calculate(data: Partial<Remittance>): Promise<any> {
    const response = await api.post(`${this.endpoint}/calculate`, data)
    return response.data.data
  }

  async uploadReceipt(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/upload-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.url
  }
}
export const remittanceRepository = new RemittanceRepository()

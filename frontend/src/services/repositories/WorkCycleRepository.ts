import { BaseRepository } from './BaseRepository'
import type { WorkCycle } from '../../types/entities'

interface WorkCycleStatus {
  enabled: boolean
  active_cycle: WorkCycle | null
}

class WorkCycleRepository extends BaseRepository<WorkCycle> {
  constructor() { super('/work-cycles') }

  async status(): Promise<WorkCycleStatus> {
    const response = await this.post<any>('/status')
    return response as WorkCycleStatus
  }

  async toggle(enabled: boolean): Promise<void> {
    await this.post('/toggle', { enabled })
  }

  async close(id: number): Promise<void> {
    await this.post(`/${id}/close`)
  }

  async reopen(id: number): Promise<void> {
    await this.post(`/${id}/reopen`)
  }

  async report(id: number): Promise<any> {
    return this.post(`/${id}/report`)
  }
}

export const workCycleRepository = new WorkCycleRepository()

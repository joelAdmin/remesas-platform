import { BaseRepository } from './BaseRepository'
import type { PromoterCommission } from '../../types/entities'

class PromoterCommissionRepository extends BaseRepository<PromoterCommission> {
  constructor() { super('/promoter-commissions') }
}
export const promoterCommissionRepository = new PromoterCommissionRepository()

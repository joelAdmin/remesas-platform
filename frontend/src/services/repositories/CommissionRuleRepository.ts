import { BaseRepository } from './BaseRepository'
import type { CommissionRule } from '../../types/entities'

class CommissionRuleRepository extends BaseRepository<CommissionRule> {
  constructor() { super('/commission-rules') }
}
export const commissionRuleRepository = new CommissionRuleRepository()

import { BaseRepository } from './BaseRepository'
import type { ProfitSharingRule } from '../../types/entities'

class ProfitSharingRuleRepository extends BaseRepository<ProfitSharingRule> {
  constructor() { super('/profit-sharing-rules') }
}
export const profitSharingRuleRepository = new ProfitSharingRuleRepository()

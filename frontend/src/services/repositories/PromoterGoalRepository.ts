import { BaseRepository } from './BaseRepository'
import type { PromoterGoal } from '../../types/entities'

class PromoterGoalRepository extends BaseRepository<PromoterGoal> {
  constructor() { super('/promoter-goals') }
}
export const promoterGoalRepository = new PromoterGoalRepository()

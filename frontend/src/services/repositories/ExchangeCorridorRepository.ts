import { BaseRepository } from './BaseRepository'
import type { ExchangeCorridor } from '../../types/entities'

class ExchangeCorridorRepository extends BaseRepository<ExchangeCorridor> {
  constructor() { super('/exchange-corridors') }
}
export const exchangeCorridorRepository = new ExchangeCorridorRepository()

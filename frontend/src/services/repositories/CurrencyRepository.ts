import { BaseRepository } from './BaseRepository'
import type { Currency } from '../../types/entities'

class CurrencyRepository extends BaseRepository<Currency> {
  constructor() { super('/currencies') }
}
export const currencyRepository = new CurrencyRepository()

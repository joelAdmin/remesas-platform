import { BaseRepository } from './BaseRepository'
import type { Country } from '../../types/entities'

class CountryRepository extends BaseRepository<Country> {
  constructor() { super('/countries') }
}
export const countryRepository = new CountryRepository()

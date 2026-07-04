import { BaseRepository } from './BaseRepository'
import type { SourceAccount } from '../../types/entities'

class SourceAccountRepository extends BaseRepository<SourceAccount> {
  constructor() { super('/source-accounts') }
}
export const sourceAccountRepository = new SourceAccountRepository()

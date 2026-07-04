import { BaseRepository } from './BaseRepository'
import type { ClientAccount } from '../../types/entities'

class ClientAccountRepository extends BaseRepository<ClientAccount> {
  constructor() { super('/client-accounts') }
}
export const clientAccountRepository = new ClientAccountRepository()

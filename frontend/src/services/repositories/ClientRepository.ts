import { BaseRepository } from './BaseRepository'
import type { Client } from '../../types/entities'

class ClientRepository extends BaseRepository<Client> {
  constructor() { super('/clients') }
}
export const clientRepository = new ClientRepository()

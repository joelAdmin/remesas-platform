import { BaseRepository } from './BaseRepository'
import type { User } from '../../types/auth'

class UserRepository extends BaseRepository<User> {
  constructor() { super('/users') }
}
export const userRepository = new UserRepository()

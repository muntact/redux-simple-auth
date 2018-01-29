/** @flow*/
import type { Authenticator } from './flow-types'

export default ({
  name,
  restore = (): Promise<void> => Promise.reject(),
  authenticate = (): Promise<void> => Promise.reject()
}: Authenticator = {}) => {
  if (name == null) {
    throw new Error('Authenticators must define a `name` property')
  }

  if (typeof name !== 'string') {
    throw new Error(
      'Expected the `name` property of the authenticator to be a string'
    )
  }

  return {
    name,
    restore,
    authenticate
  }
}

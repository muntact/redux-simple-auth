import createLocalStorageStore from './storage/localStorage'
import { AUTHENTICATE } from './actionTypes'
import {
  authenticateFailed,
  authenticateSucceeded,
  restore,
  restoreFailed
} from './actions'

const createAuthMiddleware = (config = {}) => {
  const storage = config.storage || createLocalStorageStore()
  const authenticators = config.authenticators || []

  const findAuthenticator = name =>
    authenticators.find(authenticator => authenticator.name === name)

  return ({ dispatch, getState }) => {
    storage
      .restore()
      .then(({ authenticated = {} }) => {
        const { authenticator: authenticatorName, ...data } = authenticated
        const authenticator = findAuthenticator(authenticatorName)

        if (authenticator) {
          return authenticator
            .restore(data)
            .then(
              () => dispatch(restore(authenticated)),
              () => dispatch(restoreFailed())
            )
        }
      })

    return next => action => {
      switch (action.type) {
        case AUTHENTICATE:
          const authenticator = findAuthenticator(action.authenticator)

          return authenticator
            .authenticate(action.payload)
            .then(
              data => dispatch(authenticateSucceeded(authenticator.name, data)),
              () => dispatch(authenticateFailed()))
        default:
          const { session: prevSession } = getState()
          next(action)
          const { session } = getState()

          if (session.data !== prevSession.data) {
            const { authenticator, data } = session

            storage.persist({ authenticated: { ...data, authenticator }})
          }
      }
    }
  }
}

export default createAuthMiddleware

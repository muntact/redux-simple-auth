/** @flow*/
import defaultStorage from './storage/default'
import isPlainObject from 'lodash.isplainobject'
import { AUTHENTICATE, FETCH } from './actionTypes'
import {
  authenticateFailed,
  authenticateSucceeded,
  invalidateSession,
  restore,
  restoreFailed
} from './actions'

import type {
  Config,
  Dispatch as Next,
  FetchArgs,
  ThunkArgs
} from './flow-types'

const validateAuthenticatorsPresence = ({ authenticator, authenticators }) => {
  if (authenticator == null && authenticators == null) {
    throw new Error(
      'No authenticator was given. Be sure to configure an authenticator ' +
        'by using the `authenticator` option for a single authenticator or ' +
        'using the `authenticators` option to allow multiple authenticators'
    )
  }
}

const validateAuthenticatorsIsArray = authenticators => {
  if (!Array.isArray(authenticators)) {
    throw new Error(
      'Expected `authenticators` to be an array. If you only need a single ' +
        'authenticator, consider using the `authenticator` option.'
    )
  }
}

const validateAuthenticatorIsObject = authenticator => {
  if (!isPlainObject(authenticator)) {
    throw new Error(
      'Expected `authenticator` to be an object. If you need multiple ' +
        'authenticators, consider using the `authenticators` option.'
    )
  }
}

const validateConfig = config => {
  const { authenticator, authenticators } = config

  validateAuthenticatorsPresence(config)
  authenticator == null && validateAuthenticatorsIsArray(authenticators)
  authenticators == null && validateAuthenticatorIsObject(authenticator)
}

export default (config: Config = {}) => {
  validateConfig(config)

  const {
    authenticator,
    authenticators,
    authorize,
    storage = defaultStorage
  } = config

  let findAuthenticator

  if (authenticator) {
    findAuthenticator = name => authenticator
  } else if (authenticators) {
    findAuthenticator = name =>
      authenticators.find(authenticator => authenticator.name === name)
  } else {
    throw new Error(
      'invalid arguments: no `authenticator` or `authenticators` provided'
    )
  }

  return ({ dispatch, getState }: ThunkArgs) => {
    /* The validation for storage.restore is non-trivial as storage.restore 
    returns mixed types we could improve the typing inferences around this by
    adding validation logic to the various storage restore functions */

    // $FlowFixMe
    const { authenticated = {} } = storage.restore() || {}
    const { authenticator: authenticatorName, ...data } = authenticated
    const authenticator = findAuthenticator(authenticatorName)

    if (authenticator && authenticator.restore) {
      authenticator
        .restore(data)
        .then(
          () => dispatch(restore(authenticated)),
          () => dispatch(restoreFailed())
        )
    } else {
      dispatch(restoreFailed())
    }

    return (next: Next) => (action: Object) => {
      switch (action.type) {
        case AUTHENTICATE: {
          const authenticator = findAuthenticator(action.meta.authenticator)

          if (!authenticator || !authenticator.authenticate) {
            throw new Error(
              `No authenticator with name \`${action.meta.authenticator}\` ` +
                'was found. Be sure you have defined it in the authenticators ' +
                'config.'
            )
          }

          return authenticator
            .authenticate(action.payload)
            .then(
              data => dispatch(authenticateSucceeded(authenticator.name, data)),
              error => dispatch(authenticateFailed(error))
            )
        }
        case FETCH: {
          const { session } = getState()
          const { url, options = {} }: FetchArgs = action.payload
          const { headers = {} } = options

          if (authorize) {
            authorize(session.data, (name, value) => {
              // $FlowIssue / $FlowFixMe https://github.com/facebook/flow/issues/1730
              headers[name] = value
            })
          }

          // $FlowIgnore: Flow wants typings for the returned response, but we don't care
          return fetch(url, { ...options, headers }).then(response => {
            if (response.status === 401 && session.isAuthenticated) {
              dispatch(invalidateSession())
            }

            return Promise.resolve(response)
          })
        }
        default: {
          const { session: prevSession } = getState()
          const result = next(action)
          const { session } = getState()

          if (session.data !== prevSession.data) {
            const { authenticator, data } = session

            storage.persist({ authenticated: { ...data, authenticator } })
          }

          return result
        }
      }
    }
  }
}

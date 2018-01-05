import defaultStorage from './storage/default'
import { validateConfig } from './validators'
import parseDomain from 'parse-domain'

import { AUTHENTICATE, FETCH } from './actionTypes'
import {
  authenticateFailed,
  authenticateSucceeded,
  invalidateSession,
  restore,
  restoreFailed
} from './actions'

export default (realms = {}) => {
  Object.keys(realms).forEach(realmName =>
    validateConfig(realmName, realms[realmName])
  )

  const findAuthenticator = (realmName, authenticatorName) => {
    const { authenticator, authenticators } = realms[realmName]
    return authenticator
      ? () => authenticator
      : authenticatorName =>
          authenticators.find(
            authenticator => authenticator.name === authenticatorName
          )
  }

  return ({ dispatch, getState }) => {
    Object.keys(realms).forEach(realmName => {
      const config = realms[realmName]
      config.storage = config.storage || defaultStorage
      const { authenticated = {} } = config.storage.restore() || {}
      const { authenticator: authenticatorName, ...data } = authenticated
      const authenticator = findAuthenticator(realmName, authenticatorName)

      if (authenticator) {
        authenticator
          .restore(data)
          .then(
            () => dispatch(restore(authenticated)),
            () => dispatch(restoreFailed())
          )
      }
    })

    return next => action => {
      switch (action.type) {
        case AUTHENTICATE: {
          const {
            meta: { realm, authenticator: authenticatorr },
            payload
          } = action
          const authenticator = findAuthenticator(realm, authenticatorr)

          if (!authenticator) {
            throw new Error(
              `No authenticator with name \`${authenticator}\` in the realm: \`${realm}\`` +
                'was found. Be sure you have defined it in the authenticators ' +
                'config.'
            )
          }

          return authenticator
            .authenticate(payload)
            .then(
              data =>
                dispatch(
                  authenticateSucceeded(realm, authenticator.name, data)
                ),
              error => dispatch(authenticateFailed(realm, error))
            )
        }
        case FETCH: {
          const { url, options = {} } = action.payload
          const { headers = {} } = options

          // TODO: find a better thing than parseDomain :(. its 69k gzipped.
          const { subdomain, domain } = parseDomain(url)
          const matchingRealm = realms[`${subdomain}${domain}`]
          const session = getState().session[matchingRealm]

          const authorize = matchingRealm ? matchingRealm.authorize : false

          if (authorize) {
            matchingRealm.authorize(session.data, (name, value) => {
              headers[name] = value
            })
          }

          return fetch(url, { ...options, headers }).then(response => {
            if (response.status === 401 && session.isAuthenticated) {
              dispatch(invalidateSession())
            }

            return response
          })
        }
        default: {
          const { session: prevSession } = getState()
          next(action)
          const { session } = getState()

          Object.keys(session).forEach(realmName => {
            const realmSession = session[realmName]
            if (realmSession.data !== prevSession[realmName].data) {
              // need to grab all the values out of session...
              const { authenticator, data } = realmSession
              realms[realmName].storage.persist({
                authenticated: { ...data, authenticator }
              })
            }
          })
        }
      }
    }
  }
}

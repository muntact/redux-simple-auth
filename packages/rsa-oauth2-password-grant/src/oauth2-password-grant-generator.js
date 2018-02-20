import { createAuthenticator } from 'redux-simple-auth'

import Oauth2PasswordGrantBrowser from './authenticators/oauth2-password-grant-browser'
import Oauth2PasswordGrantNative from './authenticators/oauth2-password-grant-native'
import { default as authorizer } from './authorizers/oauth2-bearer'

export const name = 'oauth2-password-grant'

const generateOauth2BearerStrategy = ({
  url,
  restoreFunction = null,
  isNative = false,
  client_id,
  client_secret
}) => {
  const instance = isNative
    ? new Oauth2PasswordGrantNative({
        serverTokenEndpoint: url,
        client_id,
        client_secret
      })
    : new Oauth2PasswordGrantBrowser({ serverTokenEndpoint: url })

  const restore =
    typeof restoreFunction === 'function' ? restoreFunction : instance.restore

  const authenticator = createAuthenticator({
    name,
    authenticate: instance.authenticate,
    restore
  })

  return { authenticator, authorizer }
}

export default generateOauth2BearerStrategy

import { Base64 } from 'js-base64'
import isEmpty from 'lodash.isempty'
import OAuth2PasswordGrantAuthenticator from './oauth2-password-grant-base'

let client_id
let client_secret

// Convert client_id and client_secret into an auth header...
const generateClientIdHeader = (clientId, clientSecret) => {
  if (!isEmpty(clientId)) {
    return {
      Authorization: `Basic ${Base64.encode(`${clientId}:${clientSecret}`)}`
    }
  }
  console.error(
    'Native Password Grant Authenticaor: expected a client_id and client_secret to be set'
  )
  return {}
}

// An implementation of OAuth2PasswordGrantAuthenticator that sends client_id and client_secret.
class NativeOAuth2PasswordGrantAuthenticator extends OAuth2PasswordGrantAuthenticator {
  constructor(args) {
    super(args)
    // TODO: we should write a RSA style configuration validator for this, i.e. if id / secret omitted, throw.
    client_id = args.client_id
    client_secret = args.client_secret
  }

  makeRequest(url, data, headers) {
    const headersWithSecret = {
      ...headers,
      ...generateClientIdHeader(client_id, client_secret)
    }
    return super.makeRequest(url, data, headersWithSecret)
  }
}

export default NativeOAuth2PasswordGrantAuthenticator

/* TODO: need typing support isempty doesn't work on numbers :( */
import isEmpty from 'lodash.isempty'
import isUndefined from 'lodash.isundefined'

import {
  absolutizeExpirationTime,
  generateClientIdHeader,
  makeArray,
  validate
} from '../utils/oauth2-password-grant'

/**
  Authenticator that conforms to OAuth 2
  ([RFC 6749](http://tools.ietf.org/html/rfc6749)), specifically the _"Resource
  Owner Password Credentials Grant Type"_.

  This authenticator also automatically refreshes access tokens (see
  [RFC 6749, section 6](http://tools.ietf.org/html/rfc6749#section-6)) if the
  server supports it.

  @class OAuth2PasswordGrantAuthenticator
  @module ember-simple-auth/authenticators/oauth2-password-grant
  @extends BaseAuthenticator
  @public
*/
class OAuth2PasswordGrantAuthenticator {
  constructor({
    /**
      The client_id to be sent to the authentication server (see https://tools.ietf.org/html/rfc6749#appendix-A.1).
      __This should only be used for statistics or logging etc. as it cannot actually be trusted since it could have been manipulated on the
      client!__
    */
    clientId = null,
    // The endpoint on the server that authentication and token refresh requests are sent to.
    serverTokenEndpoint = '/token',
    /**
      The endpoint on the server that token revocation requests are sent to. Only set this if the server actually supports token revocation.
      If this is `null`, the authenticator will not revoke tokens on session invalidation.
      __If token revocation is enabled but fails, session invalidation will be intercepted and the session will remain authenticated (see
    */
    serverTokenRevocationEndpoint = null,
    // Sets whether the authenticator automatically refreshes access tokens if the server supports it.
    refreshAccessTokens = true,
    refreshTokenTimeout = null,
    tokenRefreshOffset = 0,
    /**
      When authentication fails, the rejection callback is provided with the whole Fetch API
      [Response](https://fetch.spec.whatwg.org/#response-class) object instead of its responseJSON or responseText.

      This is useful for cases when the backend provides additional context not available in the response body.
    */
    // TODO: implement rejectWithResponse - response.text() stuff.
    rejectWithResponse = false
  }) {
    this._clientIdHeader = generateClientIdHeader(clientId)
    this.serverTokenEndpoint = serverTokenEndpoint
    this.serverTokenRevocationEndpoint = serverTokenRevocationEndpoint
    this.refreshAccessTokens = refreshAccessTokens
    this.refreshTokenTimeout = refreshTokenTimeout
    this.rejectWithResponse = rejectWithResponse
    this.tokenRefreshOffset = tokenRefreshOffset

    this.makeRequest = this.makeRequest.bind(this)
    this.restore = this.restore.bind(this)
    this.authenticate = this.authenticate.bind(this)
    this.invalidate = this.invalidate.bind(this)
    this.scheduleAccessTokenRefresh = this.scheduleAccessTokenRefresh.bind(this)
    this.refreshAccessToken = this.refreshAccessToken.bind(this)
  }

  /**
    Makes a request to the OAuth 2.0 server.

    @method makeRequest
    @param {String} url The request URL
    @param {Object} data The request data
    @param {Object} headers Additional headers to send in request
    @return {Promise} An inflight promise that resolves with the response object or errors.
    @protected
  */
  makeRequest(url, data, definedHeaders = { Authorization: undefined }) {
    const { _clientIdHeader } = this
    const body = Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&')
    let headers = {}

    // Allows an Auth header to be set which an extended class might override later.
    if (!isEmpty(_clientIdHeader)) {
      headers = { ..._clientIdHeader }
    }

    headers = {
      ...headers,
      ...definedHeaders,
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    const options = { body, headers, method: 'POST' }

    // yeah we have an inner promise because we want to be able to
    // reject with response data.... wat.
    return fetch(url, options).then(response =>
      response.text().then(responseText => {
        let responseJSON
        try {
          responseJSON = JSON.parse(responseText)
        } catch (SyntaxError) {
          throw responseText
        }

        if (!response.ok) {
          throw responseJSON
        }
        return responseJSON
      })
    )
  }

  /**
    Restores the session from a session data object; __will return a resolving promise when there is a non-empty `access_token` in the
    session data__ and a rejecting promise otherwise.

    If the server issues [expiring access tokens](https://tools.ietf.org/html/rfc6749#section-5.1) and there is an expired access token in
    the session data along with a refresh token, the authenticator will try to refresh the access token and return a promise that resolves
    with the new access token if the refresh was successful. If there is no refresh token or the token refresh is not successful, a
    rejecting promise will be returned.

    @method restore
    @param {Object} data The data to restore the session from
    @return {Promise} A promise that when it resolves results in the session becoming or remaining authenticated
    @public
  */
  restore(data = {}) {
    return new Promise((resolve, reject) => {
      const {
        refreshAccessToken,
        refreshAccessTokens,
        scheduleAccessTokenRefresh
      } = this
      const now = new Date().getTime()
      const { expires_at, expires_in, refresh_token } = data

      if (!isUndefined(expires_at) && expires_at < now) {
        if (refreshAccessTokens) {
          refreshAccessToken(expires_in, refresh_token).then(resolve, reject)
        } else {
          reject()
        }
      } else if (!validate(data)) {
        reject()
      } else {
        scheduleAccessTokenRefresh(expires_in, expires_at, refresh_token)
        resolve(data)
      }
    })
  }

  /**
    Authenticates the session with the specified `identification`, `password`
    and optional `scope`; issues a `POST` request to the
    {{#crossLink "OAuth2PasswordGrantAuthenticator/serverTokenEndpoint:property"}}{{/crossLink}}
    and receives the access token in response (see
    http://tools.ietf.org/html/rfc6749#section-4.3).

    __If the credentials are valid (and the optionally requested scope is
    granted) and thus authentication succeeds, a promise that resolves with the
    server's response is returned__, otherwise a promise that rejects with the
    error as returned by the server is returned.

    __If the
    [server supports it](https://tools.ietf.org/html/rfc6749#section-5.1), this
    method also schedules refresh requests for the access token before it
    expires.__

    @method authenticate
    @param {String} identification The resource owner username
    @param {String} password The resource owner password
    @param {String|Array} scope The scope of the access request (see [RFC 6749, section 3.3](http://tools.ietf.org/html/rfc6749#section-3.3))
    @param {Object} headers Optional headers that particular backends may require (for example sending 2FA challenge responses)
    @return {Promise} A promise that when it resolves results in the session becoming authenticated
    @public
  */
  authenticate({ identification, password, scope = [], headers = {} }) {
    return new Promise((resolve, reject) => {
      const { /* rejectWithResponse, */ serverTokenEndpoint } = this
      const scopesString = makeArray(scope).join(' ')
      const data = {
        grant_type: 'password',
        username: identification,
        password
      }

      if (!isEmpty(scopesString)) {
        data.scope = scopesString
      }

      this.makeRequest(serverTokenEndpoint, data, headers).then(
        response => {
          if (!validate(response)) {
            reject('access_token is missing in server response')
          }

          const { expires_in, refresh_token } = response
          const expires_at = absolutizeExpirationTime(expires_in)

          this.scheduleAccessTokenRefresh(expires_in, expires_at, refresh_token)

          resolve(
            !isUndefined(expires_at) ? { ...response, expires_at } : response
          )
        },
        response => {
          // reject(rejectWithResponse ? response : (response.responseJSON || response.responseText));
          reject(response)
        }
      )
    })
  }

  /**
    If token revocation is enabled, this will revoke the access token (and the refresh token if present). If token revocation succeeds,
    this method returns a resolving promise, otherwise it will return a rejecting promise, thus intercepting session invalidation.

    If token revocation is not enabled this method simply returns a resolving promise.

    @method invalidate
    @param {Object} data The current authenticated session data
    @return {Promise} A promise that when it resolves results in the session being invalidated
    @public
  */
  invalidate(data) {
    const { serverTokenRevocationEndpoint } = this

    const clear = cb => {
      if (this.refreshTokenTimeout) {
        clearTimeout(this.refreshTokenTimeout)
      }
      cb()
    }

    return new Promise(resolve => {
      if (isEmpty(serverTokenRevocationEndpoint)) {
        clear(resolve)
      } else {
        const requests = ['access_token', 'refresh_token']
          .map(tokenType => {
            const token = data[tokenType]
            return !isEmpty(token)
              ? this.makeRequest(serverTokenRevocationEndpoint, {
                  token_type_hint: tokenType,
                  token
                })
              : null
          })
          .filter(Boolean)

        Promise.all(requests)
          .then(() => clear(resolve))
          .catch(() => clear(resolve))
      }
    })
  }

  scheduleAccessTokenRefresh(expiresIn, expiresAt, refreshToken) {
    const { refreshAccessTokens, tokenRefreshOffset } = this
    if (refreshAccessTokens) {
      const now = new Date().getTime()

      const expirezAt =
        isUndefined(expiresAt) && !isUndefined(expiresIn)
          ? expiresAt
          : new Date(now + expiresIn * 1000).getTime()

      if (
        !isEmpty(refreshToken) &&
        !isUndefined(expirezAt) &&
        expirezAt > now - tokenRefreshOffset
      ) {
        clearTimeout(this.refreshTokenTimeout)
        // TODO: implement testing around the refreshAccessToken stub being called using sinon.timers.
        this.refreshTokenTimeout = setTimeout(() => {
          this.refreshAccessToken(expiresIn, refreshToken)
        }, expirezAt - now - tokenRefreshOffset)
      }
    }
  }

  refreshAccessToken(defaultExpiresIn, defaultRefreshToken) {
    const data = {
      grant_type: 'refresh_token',
      refresh_token: defaultRefreshToken
    }

    return this.makeRequest(this.serverTokenEndpoint, data).then(
      response => {
        const {
          expires_in = defaultExpiresIn,
          refresh_token = defaultRefreshToken
        } = response
        const expiresAt = absolutizeExpirationTime(expires_in)

        const responseData = {
          ...response,
          expires_in,
          expires_at: expiresAt,
          refresh_token
        }

        this.scheduleAccessTokenRefresh(expires_in, null, refresh_token)
        // TODO: Is there a redux action that could be fired now???
        // this.trigger('sessionDataUpdated', data);
        return responseData
      },
      response => {
        // TODO: this should be response.responseJSON
        // eslint-disable-next-line no-console
        console.warn(
          `Access token could not be refreshed - server responded with ${response}.`
        )
        return Promise.reject()
      }
    )
  }
}

export default OAuth2PasswordGrantAuthenticator

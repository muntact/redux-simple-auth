import omit from 'lodash.omit'

import OAuth2PasswordGrant from '../../src/authenticators/oauth2-password-grant-browser'
import { generateClientIdHeader } from '../../src/utils/oauth2-password-grant'

describe('OAuth2PasswordGrantAuthenticator', () => {
  const serverData = {
    access_token: 'secret token!',
    expires_in: 12345,
    refresh_token: 'refresh token!'
  }
  const restoreData = {
    access_token: 'secret token!',
    expires_at: 1
  }

  const url = '/test/url'
  const revokeUrl = '/revoke'

  const parsePostData = body => {
    // should probably have a gaurd here for [1].body.
    const result = {}
    body.split('&').forEach(part => {
      const item = part.split('=')
      result[item[0]] = decodeURIComponent(item[1])
    })
    return result
  }

  let authenticator

  beforeEach(() => {
    authenticator = new OAuth2PasswordGrant({ serverTokenEndpoint: url })
  })

  afterEach(() => {
    fetchMock.restore()
  })

  describe('restore', () => {
    describe('when the data includes expiration data', () => {
      test('resolves with the correct data', () =>
        expect(authenticator.restore(serverData)).resolves.toEqual(serverData))

      describe('when the data includes an expiration time in the past', () => {
        describe('when automatic token refreshing is enabled', () => {
          describe('when the refresh request is successful', () => {
            test('resolves with the correct data', done => {
              fetchMock.post(url, { ...serverData })

              authenticator.restore(restoreData).then(data => {
                expect(data.expires_at).toBeGreaterThan(new Date().getTime())
                expect(omit(data, ['expires_at'])).toEqual(serverData)
                done()
              })
            })
          })

          describe('when the access token is not refreshed successfully', () => {
            test('returns a rejecting promise', () => {
              fetchMock.post(url, { status: 500, body: {} })

              return expect(
                authenticator.restore({
                  access_token: 'secret token!',
                  expires_at: 1
                })
              ).rejects.toBeUndefined()
            })
          })
        })

        describe('when automatic token refreshing is disabled', () => {
          test('returns a rejecting promise', () => {
            authenticator.refreshAccessTokens = false
            return expect(
              authenticator.restore({
                access_token: 'secret token!',
                expires_at: 1
              })
            ).rejects.toBeUndefined()
          })
        })
      })
    })

    describe('when the data does not include expiration data', () => {
      describe('when the data contains an access_token', () => {
        test('resolves with the correct data', () => {
          const serverDataWithoutExpirationTime = omit(serverData, [
            'expires_in'
          ])
          return expect(
            authenticator.restore(serverDataWithoutExpirationTime)
          ).resolves.toEqual(serverDataWithoutExpirationTime)
        })
      })

      describe('when the data does not contain an access_token', () => {
        test('returns a rejecting promise', () =>
          expect(authenticator.restore()).rejects.toBeUndefined())
      })
    })
  })

  describe('authenticate', () => {
    const userCredentials = { identification: 'username', password: 'password' }

    test('sends an AJAX request to the token endpoint', done => {
      fetchMock.post(url, serverData)

      authenticator.authenticate(userCredentials).then(() => {
        expect(fetchMock.called(url)).toBe(true)
        expect(parsePostData(fetchMock.lastCall(url)[1].body)).toEqual({
          grant_type: 'password',
          username: 'username',
          password: 'password'
        })
        done()
      })
    })

    // sketchy behaviour anyways, only 'okay' on web as logging mechanism.
    test('sends an AJAX request to the token endpoint with client_id Basic Auth header', done => {
      fetchMock.post(url, serverData)
      authenticator._clientIdHeader = generateClientIdHeader('test-client')

      authenticator.authenticate(userCredentials).then(() => {
        expect(fetchMock.called(url)).toBe(true)
        expect(fetchMock.lastCall(url)[1].headers.Authorization).toEqual(
          'Basic dGVzdC1jbGllbnQ6'
        )
        done()
      })
    })

    test('sends an AJAX request to the token endpoint with customized headers', done => {
      fetchMock.post(url, serverData)

      authenticator
        .authenticate({
          ...userCredentials,
          scopes: [],
          headers: { 'x-custom-context': 'foobar' }
        })
        .then(() => {
          expect(fetchMock.called(url)).toBe(true)
          expect(
            fetchMock.lastCall(url)[1].headers['x-custom-context']
          ).toEqual('foobar')
          done()
        })
    })

    test('sends a single OAuth scope to the token endpoint', done => {
      fetchMock.post(url, serverData)

      authenticator
        .authenticate({ ...userCredentials, scope: 'public' })
        .then(() => {
          expect(fetchMock.called(url)).toBe(true)
          const { scope } = parsePostData(fetchMock.lastCall(url)[1].body)
          expect(scope).toEqual('public')
          done()
        })
    })

    test('sends multiple OAuth scopes to the token endpoint', done => {
      fetchMock.post(url, serverData)

      authenticator
        .authenticate({ ...userCredentials, scope: ['public', 'private'] })
        .then(() => {
          expect(fetchMock.called(url)).toBe(true)
          const { scope } = parsePostData(fetchMock.lastCall(url)[1].body)
          expect(scope).toEqual('public private')
          done()
        })
    })

    describe('when the authentication request is successful', () => {
      test('resolves with the correct data - no expiration value supplied', () => {
        fetchMock.post(url, { access_token: 'access_token' })
        authenticator.refreshAccessTokens = false
        return expect(
          authenticator.authenticate(userCredentials)
        ).resolves.toEqual({ access_token: 'access_token' })
      })

      describe('when the server response includes expiration data', () => {
        test('resolves with the correct data', done => {
          fetchMock.post(url, serverData)
          authenticator.authenticate('username', 'password').then(data => {
            const dataWithoutExpiresAt = omit(data, ['expires_at'])
            expect(data.expires_at).toBeGreaterThan(new Date().getTime())
            expect(dataWithoutExpiresAt).toEqual(serverData)
            done()
          })
        })
      })

      describe('when the server response is missing access_token', () => {
        test('fails with a string describing the issue', () => {
          fetchMock.post(url, {})
          return expect(
            authenticator.authenticate(userCredentials)
          ).rejects.toEqual('access_token is missing in server response')
        })
      })

      // TODO: circle back to the responseText feature
      describe.skip('but the response is not valid JSON', () => {
        test('fails with the string of the response', () => {
          fetchMock.post(url, {})

          // server.post('/token', () => [200, { 'Content-Type': 'text/plain' }, 'Something went wrong']);

          return authenticator
            .authenticate('username', 'password')
            .catch(error => {
              expect(error).toEqual('Something went wrong')
            })
        })
      })
    })

    describe('when the authentication request fails', () => {
      beforeEach(() => {
        fetchMock.post(url, {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'x-custom-context': 'foobar'
          },
          body: { error: 'invalid_grant' }
        })
      })

      test('rejects with the parsed JSON response', () =>
        expect(authenticator.authenticate(userCredentials)).rejects.toEqual({
          error: 'invalid_grant'
        }))

      describe.skip('when rejectWithResponse is enabled', () => {
        beforeEach(() => {
          authenticator.set('rejectWithResponse', true)
        })

        test('rejects with response object containing responseJSON', () =>
          authenticator.authenticate('username', 'password').catch(error => {
            expect(error.responseJSON).toEqual({ error: 'invalid_grant' })
          }))

        test('provides access to custom headers', () =>
          authenticator.authenticate('username', 'password').catch(error => {
            expect(error.headers.get('x-custom-context')).toEqual('foobar')
          }))
      })
    })

    describe('when the authentication request fails without a valid response', () => {
      beforeEach(() => {
        fetchMock.post(url, {
          status: 500,
          headers: {
            'Content-Type': 'text/plain',
            'x-custom-context': 'foobar'
          },
          body: 'The server has failed completely.'
        })
      })

      test('rejects with the response body', () =>
        expect(authenticator.authenticate(userCredentials)).rejects.toEqual(
          'The server has failed completely.'
        ))

      describe.skip('when rejectWithResponse is enabled', () => {
        beforeEach(() => {
          authenticator.set('rejectWithResponse', true)
        })

        test('rejects with response object containing responseText', () =>
          authenticator.authenticate('username', 'password').catch(error => {
            expect(error.responseJSON).to.not.exist
            expect(error.responseText).toEqual(
              'The server has failed completely.'
            )
          }))

        test('provides access to custom headers', () =>
          authenticator.authenticate('username', 'password').catch(error => {
            expect(error.headers.get('x-custom-context')).toEqual('foobar')
          }))
      })
    })
  })

  describe('invalidate', () => {
    const itSuccessfullyInvalidatesTheSession = () => {
      expect(
        authenticator.invalidate({ access_token: 'access token!' })
      ).resolves.toBeUndefined()
    }

    describe('when token revokation is enabled', () => {
      beforeEach(() => {
        authenticator.serverTokenRevocationEndpoint = revokeUrl
      })

      test('sends an AJAX request to the revokation endpoint', done => {
        fetchMock.post(revokeUrl, {})
        authenticator.invalidate({ access_token: 'access token!' }).then(() => {
          expect(fetchMock.called(revokeUrl)).toBe(true)
          expect(parsePostData(fetchMock.lastCall(revokeUrl)[1].body)).toEqual({
            token_type_hint: 'access_token',
            token: 'access token!'
          })
          done()
        })
      })

      describe('when the revokation request is successful', () => {
        test('successfully invalidates the session', () => {
          fetchMock.post(revokeUrl, {})
          itSuccessfullyInvalidatesTheSession()
        })
      })

      describe('when the revokation request fails', () => {
        test('successfully invalidates the session', () => {
          fetchMock.post(revokeUrl, {
            status: 400,
            headers: { 'content-type': 'application/json' },
            body: '{ "error": "unsupported_grant_type" }'
          })

          itSuccessfullyInvalidatesTheSession()
        })
      })

      describe('when a refresh token is set', () => {
        test('sends an AJAX request to invalidate the refresh token', done => {
          fetchMock.post(revokeUrl, {})

          authenticator
            .invalidate({
              access_token: 'access token!',
              refresh_token: 'refresh token!'
            })
            .then(() => {
              expect(fetchMock.called(revokeUrl)).toBe(true)
              expect(fetchMock.calls(revokeUrl).length).toEqual(2)
              expect(
                fetchMock
                  .calls(revokeUrl)
                  .map(call => parsePostData(call[1].body))[1]
              ).toEqual({
                token_type_hint: 'refresh_token',
                token: 'refresh token!'
              })
              done()
            })
        })
      })
    })

    describe('when token revokation is not enabled', () => {
      test('successfully invalidates the session', () => {
        itSuccessfullyInvalidatesTheSession()
      })
    })
  })

  // this feature is not implemented because we don't handle a multi-window case -_-
  describe.skip('tokenRefreshOffset', () => {
    test('returns a number between 5000 and 10000', done => {
      expect(authenticator.get('tokenRefreshOffset')).to.be.at.least(5000)
      expect(authenticator.get('tokenRefreshOffset')).to.be.below(10000)
      done()
    })
  })

  describe('refreshAccessToken', () => {
    test('sends an AJAX request to the token endpoint', done => {
      fetchMock.post(url, {})

      authenticator.refreshAccessToken(12345, 'refresh token!').then(() => {
        expect(fetchMock.called(url)).toBe(true)
        const body = parsePostData(fetchMock.lastCall(url)[1].body)
        expect(body).toEqual({
          grant_type: 'refresh_token',
          refresh_token: 'refresh token!'
        })
        done()
      })
    })

    describe('when the refresh request is successful', () => {
      // TODO: we don't implement an action here for session-data-updated :(, we probably should.
      test.skip('triggers the "sessionDataUpdated" event', done => {
        fetchMock.post(url, {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: { access_token: 'secret token 2!' }
        })

        authenticator.one('sessionDataUpdated', data => {
          const dataWithoutExpiresAt = omit(data, ['expires_at'])
          expect(data.expires_at).to.be.greaterThan(new Date().getTime())
          expect(dataWithoutExpiresAt).toEqual({
            access_token: 'secret token 2!',
            expires_in: 12345,
            refresh_token: 'refresh token!'
          })
          done()
        })

        authenticator.refreshAccessToken(12345, 'refresh token!')
      })

      describe('when the server response includes updated expiration data', () => {
        test.skip('triggers the "sessionDataUpdated" event with the correct data', done => {
          fetchMock.post(url, {
            status: 200,
            headers: { 'content-type': 'application/json' },
            body: {
              access_token: 'secret token 2!',
              expires_in: 67890,
              refresh_token: 'refresh token 2!'
            }
          })

          authenticator.one('sessionDataUpdated', data => {
            const dataWithoutExpiresAt = omit(data, ['expires_at'])
            expect(data.expires_at).to.be.greaterThan(new Date().getTime())
            expect(dataWithoutExpiresAt).toEqual({
              access_token: 'secret token 2!',
              expires_in: 67890,
              refresh_token: 'refresh token 2!'
            })
            done()
          })

          authenticator.refreshAccessToken(12345, 'refresh token!')
        })
      })
    })
  })
})

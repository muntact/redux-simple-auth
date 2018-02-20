import authorize from '../../src/authorizers/oauth2-bearer'

describe('OAuth2BearerAuthorizer', () => {
  let block

  beforeEach(() => {
    block = jest.fn()
  })

  describe('when the session data contains a non empty access_token', () => {
    test('calls the block with a Bearer token header', () => {
      authorize({ access_token: 'secret token!' }, block)
      expect(block).toBeCalledWith('Authorization', 'Bearer secret token!')
    })
  })

  describe('when the session does not contain an access_token', () => {
    test('does not call the block', () => {
      authorize({}, block)
      expect(block.mock.calls.length).toBe(0)
    })
  })
})

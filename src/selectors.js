import * as fromSession from './reducer'

export const getRealmSessionData = (state, realm) =>
  fromSession.getData(state.session, realm)

export const getRealmIsAuthenticated = (state, realm) =>
  fromSession.getIsAuthenticated(state.session, realm)

export const getRealmAuthenticator = (state, realm) =>
  fromSession.getAuthenticator(state.session, realm)

export const getRealmIsRestored = (state, realm) =>
  fromSession.getIsRestored(state.session, realm)

export const getRealmLastError = (state, realm) =>
  fromSession.getLastError(state.session, realm)

export const getRealmHasFailedAuth = (state, realm) =>
  fromSession.getHasFailedAuth(state.session, realm)

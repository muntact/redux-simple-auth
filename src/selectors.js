/** @flow*/
import * as fromSession from './reducer'

import type { AuthState } from './flow-types'

type selectorState = {
  session: AuthState
}

export const getSessionData = (state: selectorState) =>
  fromSession.getData(state.session)

export const getIsAuthenticated = (state: selectorState) =>
  fromSession.getIsAuthenticated(state.session)

export const getAuthenticator = (state: selectorState) =>
  fromSession.getAuthenticator(state.session)

export const getIsRestored = (state: selectorState) =>
  fromSession.getIsRestored(state.session)

export const getLastError = (state: selectorState) =>
  fromSession.getLastError(state.session)

export const getHasFailedAuth = (state: selectorState) =>
  fromSession.getHasFailedAuth(state.session)

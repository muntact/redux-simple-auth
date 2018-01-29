/** @flow*/
import {
  AUTHENTICATE_FAILED,
  AUTHENTICATE_SUCCEEDED,
  INITIALIZE,
  INVALIDATE_SESSION,
  RESTORE,
  RESTORE_FAILED
} from './actionTypes'

import type { Action, AuthState } from './flow-types'

export const initialState = {
  authenticator: null,
  hasFailedAuth: false,
  isAuthenticated: false,
  isRestored: false,
  lastError: null,
  data: {}
}

const reducer = (
  state: AuthState = initialState,
  action: Action
): AuthState => {
  switch (action.type) {
    case INITIALIZE:
      const { authenticated: { authenticator, ...data } = {} } = action.payload

      return {
        ...initialState,
        authenticator,
        data
      }
    case AUTHENTICATE_SUCCEEDED:
      return {
        ...state,
        hasFailedAuth: false,
        // satisfying flow...
        authenticator: action.meta && action.meta.authenticator,
        isAuthenticated: true,
        data: action.payload,
        lastError: null
      }
    case AUTHENTICATE_FAILED:
      return {
        ...state,
        authenticator: null,
        hasFailedAuth: true,
        isAuthenticated: false,
        isRestored: true,
        lastError: action.payload,
        data: {}
      }
    case INVALIDATE_SESSION:
    case RESTORE_FAILED:
      return {
        ...state,
        authenticator: null,
        isAuthenticated: false,
        isRestored: true,
        lastError: null,
        data: {}
      }
    case RESTORE: {
      const { authenticator, ...data } = action.payload

      return {
        ...state,
        authenticator,
        data,
        isAuthenticated: true,
        isRestored: true,
        lastError: null
      }
    }
    default:
      return state
  }
}

export default reducer

export const getData = (state: AuthState) => state.data
export const getIsAuthenticated = (state: AuthState) => state.isAuthenticated
export const getAuthenticator = (state: AuthState) => state.authenticator
export const getIsRestored = (state: AuthState) => state.isRestored
export const getLastError = (state: AuthState) => state.lastError
export const getHasFailedAuth = (state: AuthState) => state.hasFailedAuth

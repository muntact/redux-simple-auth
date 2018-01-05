import {
  AUTHENTICATE_FAILED,
  AUTHENTICATE_SUCCEEDED,
  INITIALIZE,
  INVALIDATE_SESSION,
  RESTORE,
  RESTORE_FAILED
} from './actionTypes'

/* return reducers and selectors on a per realm basis */
const initialState = {
  authenticator: null,
  hasFailedAuth: false,
  isAuthenticated: false,
  isRestored: false,
  lastError: null,
  data: {}
}

// TODO: need to push all of these things one deeper.
const reducer = (state = initialState, action) => {
  const { realm = 'defaults' } = action.meta
  switch (action.type) {
    case INITIALIZE:
      const {
        payload: { authenticated: { authenticator, ...data } = {} }
      } = action

      return {
        ...initialState,
        [realm]: {
          ...initialState[realm],
          authenticator,
          data
        }
      }
    case AUTHENTICATE_SUCCEEDED:
      return {
        ...state,
        [realm]: {
          ...state[realm],
          hasFailedAuth: false,
          authenticator: action.meta.authenticator,
          isAuthenticated: true,
          data: action.payload,
          lastError: null
        }
      }
    case AUTHENTICATE_FAILED:
      return {
        ...state,
        [realm]: {
          ...state[realm],
          authenticator: null,
          hasFailedAuth: true,
          isAuthenticated: false,
          isRestored: true,
          lastError: action.payload,
          data: {}
        }
      }
    case INVALIDATE_SESSION:
    case RESTORE_FAILED:
      return {
        ...state,
        [realm]: {
          ...state[realm],
          authenticator: null,
          isAuthenticated: false,
          isRestored: true,
          lastError: null,
          data: {}
        }
      }
    case RESTORE: {
      const { authenticator, ...data } = action.payload
      return {
        ...state,
        [realm]: {
          ...state[realm],
          authenticator,
          data,
          isAuthenticated: true,
          isRestored: true,
          lastError: null
        }
      }
    }
    default:
      return state
  }
}

export const getData = (state, realm) => state[realm].data
export const getIsAuthenticated = (state, realm) => state[realm].isAuthenticated
export const getAuthenticator = (state, realm) => state[realm].authenticator
export const getIsRestored = (state, realm) => state[realm].isRestored
export const getLastError = (state, realm) => state[realm].lastError
export const getHasFailedAuth = (state, realm) => state[realm].hasFailedAuth

export default reducer

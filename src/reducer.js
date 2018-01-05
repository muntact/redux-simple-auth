import {
  AUTHENTICATE_FAILED,
  AUTHENTICATE_SUCCEEDED,
  INITIALIZE,
  INVALIDATE_SESSION,
  RESTORE,
  RESTORE_FAILED
} from './actionTypes'

/* return reducers and selectors on a per realm basis */
const reducerFactory = realm => {
  const initialState = {
    authenticator: null,
    hasFailedAuth: false,
    isAuthenticated: false,
    isRestored: false,
    lastError: null,
    data: {}
  }

  const reducer = (state = initialState, action) => {
    switch (action.type) {
      case INITIALIZE:
        const {
          authenticated: { authenticator, ...data } = {}
        } = action.payload

        return {
          ...initialState,
          authenticator,
          data
        }
      case `${realm}/${AUTHENTICATE_SUCCEEDED}`:
        return {
          ...state,
          hasFailedAuth: false,
          authenticator: action.meta.authenticator,
          isAuthenticated: true,
          data: action.payload,
          lastError: null
        }
      case `${realm}/${AUTHENTICATE_FAILED}`:
        return {
          ...state,
          authenticator: null,
          hasFailedAuth: true,
          isAuthenticated: false,
          isRestored: true,
          lastError: action.payload,
          data: {}
        }
      case `${realm}/${INVALIDATE_SESSION}`:
      case `${realm}/${RESTORE_FAILED}`:
        return {
          ...state,
          authenticator: null,
          isAuthenticated: false,
          isRestored: true,
          lastError: null,
          data: {}
        }
      case `${realm}/${RESTORE}`: {
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

  const selectors = {
    getData: state => state[realm].data,
    getIsAuthenticated: state => state[realm].isAuthenticated,
    getAuthenticator: state => state[realm].authenticator,
    getIsRestored: state => state[realm].isRestored,
    getLastError: state => state[realm].lastError,
    getHasFailedAuth: state => state[realm].hasFailedAuth
  }

  return {
    reducer,
    selectors
  }
}

export default reducerFactory

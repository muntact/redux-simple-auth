import {
  AUTHENTICATE,
  AUTHENTICATE_FAILED,
  AUTHENTICATE_SUCCEEDED,
  FETCH,
  INITIALIZE,
  INVALIDATE_SESSION,
  RESTORE,
  RESTORE_FAILED
} from './actionTypes'

export const authenticate = (realm, authenticator, payload) => ({
  type: AUTHENTICATE,
  meta: { authenticator, realm },
  payload
})

export const authenticateSucceeded = (realm, authenticator, payload) => ({
  type: AUTHENTICATE_SUCCEEDED,
  meta: { authenticator, realm },
  payload
})

export const authenticateFailed = (realm, payload) => ({
  type: AUTHENTICATE_FAILED,
  meta: { realm },
  payload
})

export const fetch = (url, options) => ({
  type: FETCH,
  payload: { url, options }
})

// TODO: make this pluralized, because that is how it acts?
export const invalidateSession = realm => ({
  type: INVALIDATE_SESSION,
  meta: { realm }
})

export const restore = (realm, payload) => ({
  type: RESTORE,
  meta: { realm },
  payload
})

export const restoreFailed = realm => ({
  type: RESTORE_FAILED,
  meta: { realm }
})

export const initialize = (realm, payload) => ({
  type: INITIALIZE,
  meta: { realm },
  payload
})

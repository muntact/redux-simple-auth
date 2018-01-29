/** @flow*/
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

import type { Payload } from './flow-types'

export const authenticate = (authenticator: string, payload: Payload) => ({
  type: AUTHENTICATE,
  meta: { authenticator },
  payload
})

export const authenticateSucceeded = (
  authenticator: string,
  payload: Payload
) => ({
  type: AUTHENTICATE_SUCCEEDED,
  meta: { authenticator },
  payload
})

export const authenticateFailed = (payload: Payload) => ({
  type: AUTHENTICATE_FAILED,
  payload
})

export const fetch = (url: URL, options: RequestOptions) => ({
  type: FETCH,
  payload: { url, options }
})

export const invalidateSession = () => ({
  type: INVALIDATE_SESSION
})

export const restore = (payload: Payload) => ({
  type: RESTORE,
  payload
})

export const restoreFailed = () => ({
  type: RESTORE_FAILED
})

export const initialize = (payload: Payload) => ({
  type: INITIALIZE,
  payload
})

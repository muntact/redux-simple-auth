/* @flow */
import type { Dispatch as ReduxDispatch, Store as ReduxStore } from 'redux'

export type Dispatch = ReduxDispatch<*>
export type Store = ReduxStore<*, *>
export type GetState = () => Object

export type CookieOptions = {
  expires?: number | Date,
  path?: string,
  domain?: string,
  secure?: boolean
}

export type Authenticator = {
  name: string,
  authenticate?: (data: any) => Promise<any>,
  restore?: (data: any) => Promise<any>
}

export type Authenticators = Array<Authenticator>

export type AuthorizeCallback = (
  headerName: string,
  headerValue: string
) => void

export type Authorizer = (data: any, block: AuthorizeCallback) => void

export type AdaptiveStorageOptions = {
  localStorageKey?: string,
  cookieName?: string,
  cookieDomain?: string,
  cookiePath?: string,
  cookieExpires?: number | Date,
  cookieSecure?: boolean
}

export type CookieStorageOptions = CookieOptions & { name?: string }

export type Payload = Object

export type AuthState = {
  authenticator: ?Authenticator,
  hasFailedAuth: boolean,
  isAuthenticated: boolean,
  isRestored: boolean,
  lastError: ?Error,
  data: mixed
}

export type PersistedData = {
  authenticated: {
    authenticator: Authenticator
  } & AuthState
}

type Storage = {
  persist: (data: PersistedData) => void,
  restore: () => Object
}

// TODO: define this object such that you get authenticator OR authenticators
export type Config = {
  authenticator?: Authenticator,
  authenticators?: Authenticators,
  authorize?: Authorizer,
  storage?: Storage
}

export type EnhancerArgs = {
  storage: Storage
}

export type ThunkArgs = {
  dispatch: Dispatch,
  getState: GetState
}

export type FetchArgs = {
  url: URL,
  options: RequestOptions
}

type Meta = {
  authenticator: Authenticator
}

export type Action = {
  type: string,
  payload: Payload,
  meta?: Meta,
  query?: Object,
  navKey?: ?string
}

export type StorageInstanceArgs = { key?: string }

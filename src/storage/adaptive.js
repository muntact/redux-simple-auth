/** @flow*/
import createCookieStore from './cookie'
import createLocalStorageStore from './localStorage'
import { isLocalStorageAvailable } from '../utils/localStorage'
import type { AdaptiveStorageOptions } from '../flow-types'

export default ({
  localStorageKey: key,
  cookieName: name,
  cookiePath: path,
  cookieDomain: domain,
  cookieExpires: expires,
  cookieSecure: secure
}: AdaptiveStorageOptions = {}) =>
  isLocalStorageAvailable()
    ? createLocalStorageStore({ key })
    : createCookieStore({ name, domain, expires, path, secure })

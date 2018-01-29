/** @flow*/
import Cookie from 'js-cookie'
import type { CookieStorageOptions, PersistedData } from '../flow-types'

const DEFAULT_COOKIE_NAME = 'redux-simple-auth-session'
const secondsFromNow = seconds => new Date(Date.now() + seconds * 1000)

export default ({
  name = DEFAULT_COOKIE_NAME,
  path = '/',
  domain,
  secure = false,
  expires
}: CookieStorageOptions = {}) => ({
  persist: (data: PersistedData) => {
    Cookie.set(name, data, {
      domain,
      path,
      secure,
      expires: expires && secondsFromNow(expires)
    })
  },
  restore: () => Cookie.getJSON(name) || {}
})

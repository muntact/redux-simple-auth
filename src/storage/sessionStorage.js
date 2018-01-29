/** @flow*/
// this is literally the same file as localStorage.
import type { PersistedData, StorageInstanceArgs } from '../flow-types'

const DEFAULT_KEY = 'redux-simple-auth-session'

const createSessionStorageStore = ({
  key = DEFAULT_KEY
}: StorageInstanceArgs = {}) => ({
  persist: (data: PersistedData) => {
    sessionStorage.setItem(key, JSON.stringify(data || {}))
  },
  restore: () => {
    const sessionData = sessionStorage.getItem(key)
    if (sessionData) {
      return JSON.parse(sessionData)
    }
    return {}
  }
})

export default createSessionStorageStore

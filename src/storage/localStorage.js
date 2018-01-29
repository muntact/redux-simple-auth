/** @flow*/
import type { PersistedData, StorageInstanceArgs } from '../flow-types'

const DEFAULT_KEY = 'redux-simple-auth-session'

const createLocalStorageStore = ({
  key = DEFAULT_KEY
}: StorageInstanceArgs = {}) => ({
  persist: (data: PersistedData) => {
    localStorage.setItem(key, JSON.stringify(data || {}))
  },
  restore: () => {
    const localData = localStorage.getItem(key)
    if (localData) {
      return JSON.parse(localData)
    }
    return {}
  }
})

export default createLocalStorageStore

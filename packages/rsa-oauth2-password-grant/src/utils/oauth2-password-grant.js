import isArray from 'lodash.isarray'
import isEmpty from 'lodash.isempty'
import isUndefined from 'lodash.isundefined'

export const absolutizeExpirationTime = expiresIn =>
  !isUndefined(expiresIn)
    ? new Date(new Date().getTime() + expiresIn * 1000).getTime()
    : expiresIn

export const validate = ({ access_token = '' }) => !isEmpty(access_token)

// This should have a native / browser usage setting...
export const generateClientIdHeader = suppliedClientID => {
  if (!isEmpty(suppliedClientID)) {
    // :'( window usage...
    const base64ClientId = window.btoa(`${suppliedClientID}:`)
    return { Authorization: `Basic ${base64ClientId}` }
  }
  return suppliedClientID
}

// stole the ember make array impl too, feels like we could do better than this tho.
export const makeArray = obj => {
  if (obj === null || obj === undefined) return []
  return isArray(obj) ? obj : [obj]
}

import isPlainObject from 'lodash.isplainobject'

export const validateAuthenticatorsPresence = (
  realmName,
  { authenticator, authenticators }
) => {
  if (authenticator == null && authenticators == null) {
    throw new Error(
      `No authenticator was given for realm: ${realmName} Be sure to configure an authenticator ` +
        'by using the `authenticator` option for a single authenticator or ' +
        'using the `authenticators` option to allow multiple authenticators'
    )
  }
}

export const validateAuthenticatorsIsArray = (realmName, authenticators) => {
  if (!Array.isArray(authenticators)) {
    throw new Error(
      `Expected \`authenticators\` to be an array in realm: ${realmName}. If you only need a single` +
        'authenticator, consider using the `authenticator` option.'
    )
  }
}

export const validateAuthenticatorIsObject = (realmName, authenticator) => {
  if (!isPlainObject(authenticator)) {
    throw new Error(
      `Expected \`authenticator\` to be an object in realm: ${realmName}. If you need multiple` +
        'authenticators, consider using the `authenticators` option.'
    )
  }
}

export const validateStorage = storage => {
  if (!isPlainObject(storage) || storage.restore == null) {
    throw new Error(
      'Expected `storage` to be a valid storage. You either forgot to ' +
        'include it or you passed an invalid storage object'
    )
  }
}

export const validateConfig = (realmName, config) => {
  const { authenticator, authenticators } = config

  validateAuthenticatorsPresence(realmName, config)
  authenticator == null &&
    validateAuthenticatorsIsArray(realmName, authenticators)
  authenticators == null &&
    validateAuthenticatorIsObject(realmName, authenticator)
}

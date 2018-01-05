import { initialize } from './actions'
import { validateStorage, validateConfig } from './validators'
import reducer from './reducer'

const enhancer = ({ storage, configs } = {}) => {
  validateStorage(storage)
  Object.keys(configs).forEach(realmName =>
    validateConfig(realmName, configs[realmName])
  )

  return createStore => (rootReducer, preloadedState, enhancer) => {
    const session = Object.keys(configs).reduce((acc, realmName) => {
      acc[realmName] = reducer(null, initialize(realmName, storage.restore()))
      return acc
    }, {})

    const initialState = {
      session,
      ...preloadedState
    }

    return createStore(rootReducer, initialState, enhancer)
  }
}

export default enhancer

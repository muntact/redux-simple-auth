/** @flow*/
import isPlainObject from 'lodash.isplainobject'
import { initialize } from './actions'
import reducer, { initialState as reducerInitialState } from './reducer'

import type { StoreEnhancer } from 'redux'
import type { Store, EnhancerArgs } from './flow-types'

const validateStorage = storage => {
  if (!isPlainObject(storage) || storage.restore == null) {
    throw new Error(
      'Expected `storage` to be a valid storage. You either forgot to ' +
        'include it or you passed an invalid storage object'
    )
  }
}

const enhancer = ({ storage }: EnhancerArgs = {}) => {
  validateStorage(storage)

  const storeEnhancer: StoreEnhancer<*, *> = createStore => (
    rootReducer,
    preloadedState,
    enhancer
  ): Store => {
    // $FlowFixMe: wtf does the error here even mean :S ?
    const initialState = {
      session: reducer(reducerInitialState, initialize(storage.restore())),
      ...preloadedState
    }

    return createStore(rootReducer, initialState, enhancer)
  }

  return storeEnhancer
}

export default enhancer

/*
 *
 * Copyright (c) 2019-present for NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License ");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import Lock from './lock'
import Constants from '../config/constants'
import sdkMosaic from '../infrastructure/getMosaic'
import { 
  DataSet, 
  Timeline, 
  getStateFromManagers,
  getGettersFromManagers,
  getMutationsFromManagers,
  getActionsFromManagers
} from './manager'

const managers = [
  new Timeline(
    'timeline',
    () => sdkMosaic.getMosaicsFromIdWithLimit(Constants.PageSize),
    (key, pageSize) => sdkMosaic.getMosaicsFromIdWithLimit(pageSize, key),
    'height',
  ),
  new DataSet(
    'info',
    (mosaicHexOrNamespace) => sdkMosaic.getMosaicInfoFormatted(mosaicHexOrNamespace)
  )
]

const LOCK = Lock.create()

export default {
  namespaced: true,
  state: {
    ...getStateFromManagers(managers),
    // If the state has been initialized.
    initialized: false,
  },
  getters: {
    ...getGettersFromManagers(managers),
    getInitialized: state => state.initialized,
    getMosaicInfo: state => state.info?.data.mosaicInfo || {},
    getMetadataList: state => state.info?.data.metadataList || [],
    getMosaicRestrictionList: state => state.info?.data.mosaicRestrictionList || [],
    getMosaicRestrictionInfo: state => state.info?.data.mosaicRestrictionInfo || {}
  },
  mutations: {
    ...getMutationsFromManagers(managers),
    setInitialized: (state, initialized) => { state.initialized = initialized },
  },
  actions: {
    ...getActionsFromManagers(managers),
    // Initialize the mosaic model.
    async initialize({ commit, dispatch, getters }) {
      const callback = async () => {
        await dispatch('initializePage')
      }
      await LOCK.initialize(callback, commit, dispatch, getters)
    },

    // Uninitialize the mosaic model.
    async uninitialize({ commit, dispatch, getters }) {
      const callback = async () => {}
      await LOCK.uninitialize(callback, commit, dispatch, getters)
    },

    // Fetch data from the SDK and initialize the page.
    async initializePage(context) {
      await context.getters.timeline.setStore(context).initialFetch();
    },

    // Fetch data from the SDK.
    async fetchMosaicInfo(context, mosaicHexOrNamespace) {
      await context.getters.info.setStore(context).initialFetch(mosaicHexOrNamespace);
    }
  }
}

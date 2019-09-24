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

import * as nem from 'nem2-sdk'
import format from '../format'
import util from './util'

const REGISTER_NAMESPACE_TRANSACTION = new nem.NamespaceRegistrationTransaction(
  nem.NetworkType.MIJIN_TEST,
  0x01,
  nem.Deadline.createFromDTO([1, 0]),
  new nem.UInt64([0, 0]),
  nem.NamespaceRegistrationType.RootNamespace,
  'cat',
  nem.NamespaceId.createFromEncoded('B1497F5FBA651B4F'),
  new nem.UInt64([0, 0]),
  undefined,
  '02E8B286E73B915AE95D9FB94E4EE4EED8FF9C83CE9114A72174C7A7EB95C4DD05E72EA31E01725219E713D2EDDF2F57AEC7125C21B7AD1F297D5E1FE316EC0B',
  nem.PublicAccount.createFromPublicKey(
    '50B14146D48F931788F3ADAEE6B5C05CF2A09B75FB3FC2ACF8E9C95AF1393024',
    nem.NetworkType.MIJIN_TEST
  ),
  new nem.TransactionInfo(
    new nem.UInt64([1, 0]),
    0,
    '5D7FA14E02F1E60001529B04',
    '979ACF8EB76B756B8B465F0F09D72777931260E20810E51F211B3CA61CFB4CE6',
    '979ACF8EB76B756B8B465F0F09D72777931260E20810E51F211B3CA61CFB4CE6'
  )
)

const TRANSFER_TRANSACTION = new nem.TransferTransaction(
  nem.NetworkType.MIJIN_TEST,
  0x01,
  nem.Deadline.createFromDTO([1, 0]),
  new nem.UInt64([0, 0]),
  nem.Address.createFromEncoded('907201499665FB8835086760365556EA5BC0553921B89BD48D'),
  [
    new nem.Mosaic(new nem.MosaicId('85BBEA6CC462B244'), nem.UInt64.fromUint(449949999900000)),
    new nem.Mosaic(new nem.MosaicId('941299B2B7E1291C'), nem.UInt64.fromUint(3750000))
  ],
  nem.PlainMessage.create('Hello World!'),
  '4E7129E03791F5D38483E64B0BB327BF6BE40C4DC63315AFB486789BF0BEA2DD0AE34D2AAFD1B3EF275B7EA338F19AFE60BE194366213D8CEC6509798FB55609',
  nem.PublicAccount.createFromPublicKey(
    '50B14146D48F931788F3ADAEE6B5C05CF2A09B75FB3FC2ACF8E9C95AF1393024',
    nem.NetworkType.MIJIN_TEST
  ),
  new nem.TransactionInfo(
    new nem.UInt64([1, 0]),
    0,
    '5D7FA14E02F1E60001529B07',
    '90F1F645D6AEA45D750BA1ECFEF686619C7C149C9B8096D3D34C2F3346372E8E',
    '90F1F645D6AEA45D750BA1ECFEF686619C7C149C9B8096D3D34C2F3346372E8E'
  )
)

const TRANSACTION_LIST = [
  REGISTER_NAMESPACE_TRANSACTION,
  TRANSFER_TRANSACTION
]

const getTransactionsWithLimit = async (pageSize) => {
  return format.formatTransactions(TRANSACTION_LIST)
}

const getTransactionsSinceHashWithLimit = async (pageSize, hash) => {
  return format.formatTransactions(TRANSACTION_LIST)
}

const getTransactionsMaxHashWithLimit = async (pageSize, hash) => {
  return format.formatTransactions(TRANSACTION_LIST)
}

export default {
  namespaced: true,
  state: {
    // Holds the latest PAGE_SIZE transactions.
    latestList: [],
    // Holds the PAGE_SIZE transactions starting from current page.
    pageList: [],
    // The current page index (0-indexed).
    pageIndex: 0,
    // Subscription to new transactions.
    subscription: null,
    // Determine if the transactions model is loading.
    loading: false
  },
  getters: {
    getLatestList: util.getLatestList,
    getRecentList: util.getRecentList,
    getPageList: util.getPageList,
    getPageIndex: util.getPageIndex,
    getSubscription: util.getSubscription,
    getLoading: util.getLoading
  },
  mutations: {
    setLatestList: util.setLatestList,
    setPageList: util.setPageList,
    setPageIndex: util.setPageIndex,
    setSubscription: util.setSubscription,
    setLoading: util.setLoading,
    resetPageIndex: util.resetPageIndex,
    addLatestItem(state, item) {
      util.addLatestItemByKey(state, item, 'hash', 1)
    }
  },
  actions: {
    // Initialize the transaction model.
    // First fetch the page, then subscribe.
    async initialize({ dispatch }) {
      await dispatch('initializePage')
      await dispatch('subscribe')
    },

    // Uninitialize the transaction model.
    uninitialize({ dispatch }) {
      dispatch('unsubscribe')
    },

    // Subscribe to the latest transactions.
    async subscribe({ commit, dispatch, getters }) {
      // TODO(ahuszagh) Implement...
    },

    // Unsubscribe from the latest transactions.
    unsubscribe({ commit, getters }) {
      let subscription = getters.getSubscription
      if (subscription !== null) {
        subscription[1].unsubscribe()
        subscription[0].close()
        commit('setSubscription', null)
      }
    },

    // Add block to latest transactions.
    add({ commit }, item) {
      commit('chain/setTransactionHash', item.transactionHash, { root: true })
      commit('addLatestItem', item)
    },

    // Fetch data from the SDK and initialize the page.
    async initializePage({ commit }) {
      commit('setLoading', true)
      let transactionList = await getTransactionsWithLimit(util.PAGE_SIZE)
      commit('setPageList', transactionList)
      if (transactionList.length > 0) {
        commit('chain/setTransactionHash', transactionList[0].transactionHash, { root: true })
      }
      commit('setLoading', false)
    },

    // Fetch the next page of data.
    async fetchNextPage({ commit, getters }) {
      commit('setLoading', true)
      const pageList = getters.getPageList
      const pageIndex = getters.getPageIndex
      if (pageList.length > 0) {
        // Page is loaded, need to fetch next page.
        const index = pageList.length - 1
        const earliestTransaction = pageList[index]
        const maxTransactionHash = earliestTransaction.transactionHash
        let transactionList = await getTransactionsMaxHashWithLimit(util.PAGE_SIZE, maxTransactionHash)
        commit('setPageIndex', pageIndex + 1)
        commit('setPageList', transactionList)
      }
      commit('setLoading', false)
    },

    // Fetch the previous page of data.
    async fetchPreviousPage({ commit, getters }) {
      commit('setLoading', true)
      const pageList = getters.getPageList
      const pageIndex = getters.getPageIndex
      if (pageIndex === 1) {
        // Can specialize for the latest list.
        commit('setPageList', getters.getLatestList)
        commit('setPageIndex', 0)
      } else if (pageIndex > 0 && pageList.length > 0) {
        // Page is loaded, need to fetch previous page.
        const latestTransaction = pageList[0]
        const sinceTransactionHash = latestTransaction.transactionHash
        let transactionList = await getTransactionsSinceHashWithLimit(util.PAGE_SIZE, sinceTransactionHash)
        commit('setPageList', transactionList)
        commit('setPageIndex', pageIndex - 1)
      }
      commit('setLoading', false)
    },

    // Reset the block page to the latest list (index 0)
    resetPage({ commit, getters }) {
      if (getters.getPageIndex > 0) {
        commit('setPageList', getters.getLatestList)
        commit('resetPageIndex')
      }
    }
  }
}

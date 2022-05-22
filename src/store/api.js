import { defineStore } from 'pinia';
import axios from 'axios'
import Cookies from 'js-cookie';
import {useSettingsStore} from "./settings";
import {useTaskStore} from "./task";
import {useLayoutStore} from "./layout";
import {useResourcesStore} from "./resources";
import {useItemsStore} from "./items";
import {useEssayStore} from "./essay";
import {useSummaryStore} from "./summary";
import {useLevelsStore} from "./levels";
import {useCorrectorsStore} from "./correctors";
import md5 from 'md5';

/**
 * API Store
 * Handles the communication with the backend
 */
export const useApiStore = defineStore('api', {

    state: () => {
        return {
            // saved in storage
            backendUrl: '',                     // url to be used for REST calls
            returnUrl: '',                      // url to be called when the wsriter is closed
            userKey: '',                        // identifying key of the writing user
            environmentKey: '',                 // identifying key of the writing envirnonment (defining the task)
            itemKey: '',                        // identifying key of the correction item
            dataToken: '',                      // authentication token for transmission if data
            fileToken: '',                      // authentication token for loading files
            timeOffset: 0,                      // differnce between server time and client time (ms)

            // not saved
            initialized: false,                 // used to switch from startup screen to the editing view
            showInitFailure: false,             // show a message that the initialisation failed
            showItemLoadFailure: false,         // show a message that the loading if an item failed
            showDataReplaceConfirmation: false, // show a confirmation that the stored data should be replaced by another task or user
            showItemReplaceConfirmation: false, // show a confirmation that the stored item should be replaced by another item
        }
    },

    getters: {
        /**
         * Get the config object for REST requests
         */
        requestConfig(state) {

            return function(token) {
                let baseURL = state.backendUrl;
                let params = new URLSearchParams();

                // cut query string and set it as params
                // a REST path is added as url to the baseURL by axias calls
                let position = baseURL.search(/\?+/);
                if (position != -1) {
                    params = new URLSearchParams(baseURL.substr(position))
                    baseURL = baseURL.substr(0, position);
                }

                // add authentication info as url parameters
                // use signature instead of token because it is visible
                params.append('LongEssayUser', state.userKey);
                params.append('LongEssayEnvironment', state.environmentKey);
                params.append('LongEssaySignature', md5( state.userKey + state.environmentKey + token));

                return {
                    baseURL: baseURL,
                    params: params,
                    timeout: 30000,             // milliseconds
                    responseType: 'json',       // default
                    responseEncoding: 'utf8',   // default
                }
            }

        },

        /**
         * Get the Url for loading a file ressource
         */
        resourceUrl() {
            return function (resourceKey) {
                const config = this.requestConfig(this.fileToken);
                return config.baseURL + '/file/' + resourceKey + '?' + config.params.toString();
            }
        },

        /**
         * Get the server unix timestamp (s) corresponding to a client timestamp (ms)
         */
        serverTime(state) {
            return (clientTime) => Math.floor((clientTime - state.timeOffset) / 1000);
        },

    },


    actions: {

        /**
         * Init the state
         * Take the state from the cookies or local store
         * Trigger a reload of all data if cookie values differ from local store
         */
        async init () {

            let newContext = false;
            let newItem = false;

            // take values formerly stored
            this.backendUrl = localStorage.getItem('correctorBackendUrl');
            this.returnUrl = localStorage.getItem('correctorReturnUrl');
            this.userKey = localStorage.getItem('correctorUserKey');
            this.itemKey = localStorage.getItem('correctorItemKey');
            this.environmentKey = localStorage.getItem('correctorEnvironmentKey');
            this.dataToken = localStorage.getItem('correctorDataToken');
            this.fileToken = localStorage.getItem('correctorFileToken');
            this.timeOffset = Math.floor(localStorage.getItem('correctorTimeOffset') ?? 0);

            // check if context given by cookies differs and force a reload if neccessary
            if (!!Cookies.get('LongEssayUser') && Cookies.get('LongEssayUser') !== this.userKey) {
                this.userKey = Cookies.get('LongEssayUser');
                // stored item key is not valid for a new context
                this.itemKey = '';
                newContext = true;
            }
            if (!!Cookies.get('LongEssayEnvironment') && Cookies.get('LongEssayEnvironment') !== this.environmentKey) {
                this.environmentKey = Cookies.get('LongEssayEnvironment');
                // stored item key is not valid for a new context
                this.itemKey = '';
                newContext = true;
            }
            if (!!Cookies.get('LongEssayItem') && Cookies.get('LongEssayItem') !== this.itemKey) {
                this.itemKey = Cookies.get('LongEssayItem');
                newItem = true;
            }

            // these values can be changed without forcing a reload
            if (!!Cookies.get('LongEssayBackend') && Cookies.get('LongEssayBackend') !== this.backendUrl) {
                this.backendUrl = Cookies.get('LongEssayBackend');
            }
            if (!!Cookies.get('LongEssayReturn') && Cookies.get('LongEssayReturn') !== this.returnUrl) {
                this.returnUrl = Cookies.get('LongEssayReturn');
            }
            if (!!Cookies.get('LongEssayToken') && Cookies.get('LongEssayToken') !== this.dataToken) {
                this.dataToken = Cookies.get('LongEssayToken');
            }

            if (!this.backendUrl || !this.returnUrl || !this.userKey || !this.environmentKey || !this.dataToken)
            {
                this.showInitFailure = true;
                return;
            }

            const summaryStore = useSummaryStore();

            if (newContext) {
                // switching to a new task or user always requires a load from the backend
                // be shure that existing data is not unintentionally replaced

                if (await summaryStore.hasUnsentSavingInStorage()) {
                    console.log('init: new context, open saving');
                    this.showDataReplaceConfirmation = true;
                }
                else {
                    console.log('init: new context, no open saving');
                    if (await this.loadDataFromBackend()) {
                        this.initialized =  await this.loadItemFromBackend(this.itemKey);
                    }
                    this.updateConfig();
                }
            }
            else if (newItem) {
                // switching to a new correction item requires a load of the item related data
                // be shure that existing data is not unintentionally replaced

                if (await summaryStore.hasUnsentSavingInStorage()) {
                    console.log('init: new item, with open saving');
                    this.showItemReplaceConfirmation = true;
                }
                else {
                    console.log('init: new item, no open saving');
                    if (await this.loadDataFromStorage()) {
                        this.initialized = await this.loadItemFromBackend(this.itemKey);
                    }
                    this.updateConfig();
                }
            }
            else {
                // context and item are the same
                // check if data is already entered but not sent

                if (await summaryStore.hasUnsentSavingInStorage()) {
                    console.log('init: same context and item, with open saving');
                    if (await this.loadDataFromStorage()) {
                        this.initialized = await this.loadItemFromStorage();
                    }
                    this.updateConfig();
                }
                else {
                    console.log('init: same context and item, no open saving');
                    if (await this.loadDataFromStorage()) {
                        this.initialized = await this.loadItemFromBackend(this.itemKey);
                    }
                    this.updateConfig();
                }
            }
        },

        /**
         * init after the replacement of all data is confirmed
         */
        async initAfterReplaceDataConfirmed() {
            if (this.loadDataFromBackend()) {
                this.initialized =  await this.loadItemFromBackend(this.itemKey);
            }
            this.initialized = false;
            this.updateConfig();
        },

        /**
         * init after the replacement of the item is confirmed
         */
        async initAfterReplaceItemConfirmed() {
            this.initialized = await this.loadItemFromBackend(this.itemKey);
            this.updateConfig();
        },

        /**
         * Update the app configuration
         * This is called when the initialisation can be done silently
         * Or when a confirmation dialog is confirmed
         */
        updateConfig() {
            // remove the cookies
            // needed to distinct the call from the backend from a later reload
            Cookies.remove('LongEssayBackend');
            Cookies.remove('LongEssayReturn');
            Cookies.remove('LongEssayUser');
            Cookies.remove('LongEssayEnvironment');
            Cookies.remove('LongEssayItem');
            Cookies.remove('LongEssayToken');

            localStorage.setItem('correctorBackendUrl', this.backendUrl);
            localStorage.setItem('correctorReturnUrl', this.returnUrl);
            localStorage.setItem('correctorUserKey', this.userKey);
            localStorage.setItem('correctorEnvironmentKey', this.environmentKey);
            localStorage.setItem('correctorItemKey', this.itemKey);
            localStorage.setItem('correctorDataToken', this.dataToken);
            localStorage.setItem('correctorFileToken', this.fileToken);
        },


        /**
         * Load all data from the storage
         */
        async loadDataFromStorage() {
            console.log("loadDataFromStorage...");

            const settingsStore = useSettingsStore();
            const taskStore = useTaskStore();
            const resourcesStore = useResourcesStore();
            const levelsStore = useLevelsStore();
            const layoutStore = useLayoutStore();
            const itemsStore = useItemsStore();

            await settingsStore.loadFromStorage();
            await taskStore.loadFromStorage();
            await resourcesStore.loadFromStorage();
            await levelsStore.loadFromStorage();
            await layoutStore.loadFromStorage();
            await itemsStore.loadFromStorage();

            return true;
        },

        /**
         * Load all data from the storage
         */
        async loadItemFromStorage() {
            console.log("loadItemFromStorage...");

            const essayStore = useEssayStore();
            const correctorsStore = useCorrectorsStore();
            const summaryStore = useSummaryStore();

            await essayStore.loadFromStorage();
            await correctorsStore.loadFromStorage();
            await summaryStore.loadFromStorage();

            return true;
        },


        /**
         * Load all data from the backend
         */
        async loadDataFromBackend() {
            console.log("loadDataFromBackend...");

            let response = {};
            try {
                response = await axios.get( '/data', this.requestConfig(this.dataToken));
                this.setTimeOffset(response);
                this.refreshToken(response);
            }
            catch (error) {
                console.error(error);
                this.showInitFailure = true;
                return false;
            }

            const taskStore = useTaskStore();
            const settingsStore = useSettingsStore();
            const resourcesStore = useResourcesStore();
            const levelsStore = useLevelsStore();
            const layoutStore = useLayoutStore();
            const itemsStore = useItemsStore();

            await taskStore.loadFromData(response.data.task);
            await settingsStore.loadFromData(response.data.settings);
            await resourcesStore.loadFromData(response.data.resources);
            await levelsStore.loadFromData(response.data.levels);
            await itemsStore.loadFromData(response.data.items);
            await layoutStore.clearStorage();

            return true;
        },


        /**
         * Load the data of a new correction item from the backend
         */
        async loadItemFromBackend(itemKey) {

            console.log("loadItemFromBackend...");

            if (itemKey == '') {
                const itemsStore = useItemsStore();
                itemKey = itemsStore.firstKey
            }

            let response = {};
            try {
                response = await axios.get( '/item/' + itemKey, this.requestConfig(this.dataToken));
                this.setTimeOffset(response);
                this.refreshToken(response);
            }
            catch (error) {
                console.error(error);
                this.showItemLoadFailure = true;
                return false;
            }

            const essayStore = useEssayStore();
            const correctorsStore = useCorrectorsStore();
            const summaryStore = useSummaryStore();

            await essayStore.loadFromData(response.data.essay);
            await correctorsStore.loadFromData(response.data.correctors);
            await summaryStore.loadFromData(response.data.summary);

            this.itemKey = itemKey;
            localStorage.setItem('itemKey', this.itemKey);
            return true;
        },

        /**
         * Save the writing steps to the backend
         */
        async saveSummaryToBackend(data) {
            let response = {};
            try {
                response = await axios.put( '/summary/' + this.itemKey, data, this.requestConfig(this.dataToken));
                this.setTimeOffset(response);
                this.refreshToken(response);
                return true;
            }
            catch (error) {
                console.error(error);
                return false;
            }
        },


        /**
         * Set the offset between server time and client time
         * The offset is used to calculate the correct remaining time of the task
         * The offset should be set from the response of a REST call
         * when the response data transfer is short (no files)
         */
        setTimeOffset(response) {
            const serverTimeMs = response.headers['longessaytime'] * 1000;
            const clientTimeMs = Date.now();

            this.timeOffset = clientTimeMs - serverTimeMs;
            localStorage.setItem('correctorTimeOffset', this.timeOffset);
        },

        /**
         * Refresh the auth token with the value from the REST response
         * Each REST call will generate a new auth token
         * A token has only a certain valid time (e.g. one our)
         * Within this time a new REST call must be made to get a new valid token
         */
        refreshToken(response) {
            if (response.headers['longessaydatatoken']) {
                this.dataToken = response.headers['longessaydatatoken'];
                localStorage.setItem('correctorDataToken', this.dataToken);
            }

            if (response.headers['longessayfiletoken']) {
                this.fileToken = response.headers['longessayfiletoken'];
                localStorage.setItem('correctorFileToken', this.fileToken);
            }
        }
    }
})
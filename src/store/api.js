import { defineStore } from 'pinia';
import axios from 'axios'
import Cookies from 'js-cookie';
import {useSettingsStore} from "./settings";
import {useTaskStore} from "./task";
import {useLayoutStore} from "./layout";
import {useResourcesStore} from "./resources";
import {useEssayStore} from "./essay";
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
            dataToken: '',                      // authentication token for transmission if data
            fileToken: '',                      // authentication token for loading files
            timeOffset: 0,                      // differnce between server time and client time (ms)

            // not saved
            initialized: false,                 // used to switch from startup screen to the editing view
            review: false,                      // used to switch to the review and confirmation for a final submission
            showInitFailure: false,             // show a message that the initialisation failed
            showReplaceConfirmation: false,     // show a confirmation that the stored data should be replaced by another task or user
            showReloadConfirmation: false,      // show a confirmation that all data for the same task and user shod be reloaded from the server
            showAuthorizeFailure: false,        // show a confirmation the sending of the final authorization failed
            showFinalizeFailure: false,         // show a failure message for the final saving
            showAuthorizeFailure: false,        // show a failure message for the final authorization
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
            let lastHash = Cookies.get('LongEssayHash');

            // take values formerly stored
            this.backendUrl = localStorage.getItem('backendUrl');
            this.returnUrl = localStorage.getItem('returnUrl');
            this.userKey = localStorage.getItem('userKey');
            this.environmentKey = localStorage.getItem('environmentKey');
            this.dataToken = localStorage.getItem('dataToken');
            this.fileToken = localStorage.getItem('dataToken');
            this.timeOffset = Math.floor(localStorage.getItem('timeOffset') ?? 0);

            // check if context given by cookies differs and force a reload if neccessary
            if (!!Cookies.get('LongEssayUser') && Cookies.get('LongEssayUser') !== this.userKey) {
                this.userKey = Cookies.get('LongEssayUser');
                newContext = true;
            }
            if (!!Cookies.get('LongEssayEnvironment') && Cookies.get('LongEssayEnvironment') !== this.environmentKey) {
                this.environmentKey = Cookies.get('LongEssayEnvironment');
                newContext = true;
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

            const essayStore = useEssayStore();

            if (newContext) {
                // switching to a new task or user always requires a load from the backend
                // be shure that existing data is not unintentionally replaced

                if (await essayStore.hasUnsentSavingsInStorage()) {
                    console.log('init: new context, open savings');
                    this.showReplaceConfirmation = true;
                }
                else {
                    console.log('init: new context, no open savings');
                    await this.loadDataFromBackend();
                }
            }
            else if (lastHash) {
                // savings already exists on the server
                // check that it matches with the data in the app

                if (await essayStore.hasHashInStorage(lastHash)) {
                    console.log('init: same context, same hash');
                    await this.loadDataFromStorage();
                }
                else if (await essayStore.hasUnsentSavingsInStorage()) {
                    console.log('init: same context, hashes differ, open savings');
                    this.showReloadConfirmation = true;
                }
                else {
                    console.log('init: same context, hashes differ, no open savings');
                    await this.loadDataFromBackend();
                }
            }
            else {
                // no savings exist on the server
                // check if data is already entered but not sent

                if (await essayStore.hasUnsentSavingsInStorage()) {
                    console.log('init: same context, no server hash, open savings');
                    await this.loadDataFromStorage();
                }
                else {
                    console.log('init: same context, no server hash, no open savings');
                    await this.loadDataFromBackend();
                }
            }
        },

        /**
         * Load all data from the storage
         */
        async loadDataFromStorage() {

            console.log("loadDataFromStorage...");
            this.updateConfig();

            const settingsStore = useSettingsStore();
            const taskStore = useTaskStore();
            const resourcesStore = useResourcesStore();
            const essayStore = useEssayStore();
            const layoutStore = useLayoutStore();

            await settingsStore.loadFromStorage();
            await taskStore.loadFromStorage();
            await resourcesStore.loadFromStorage();
            await essayStore.loadFromStorage();
            await layoutStore.loadFromStorage();

            this.initialized = true;
        },


        /**
         * Load all data from the backend
         */
        async loadDataFromBackend() {

            console.log("loadDataFromBackend...");
            this.updateConfig();

            let response = {};
            try {
                response = await axios.get( '/data', this.requestConfig(this.dataToken));
                this.setTimeOffset(response);
                this.refreshToken(response);
            }
            catch (error) {
                console.error(error);
                this.showInitFailure = true;
                return;
            }

            const settingsStore = useSettingsStore();
            const taskStore = useTaskStore();
            const resourcesStore = useResourcesStore();
            const essayStore = useEssayStore();

            await settingsStore.loadFromData(response.data.settings);
            await taskStore.loadFromData(response.data.task);
            await resourcesStore.loadFromData(response.data.resources);
            await essayStore.loadFromData(response.data.essay);

            // send the time when the working on the task is started
            if (!response.data.essay.started) {
                await this.sendStart();
            }
            this.initialized = true;
        },


        /**
         * Send the time when the editing has started
         */
        async sendStart() {

            let response = {};
            let data = {
                started: this.serverTime(Date.now())
            }
            try {
                response = await axios.put( '/start', data, this.requestConfig(this.dataToken));
                this.setTimeOffset(response);
                this.refreshToken(response);
                return true;
            }
            catch (error) {
                console.error(error);
                this.showInitFailure = true;
                return false;
            }
        },


        /**
         * Save the writing steps to the backend
         */
        async saveWritingStepsToBackend(steps) {
            let response = {};
            let data = {
                steps: steps
            }
            try {
                response = await axios.put( '/steps', data, this.requestConfig(this.dataToken));
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
         * Save the final authorization to the backend
         */
        async saveFinalContentToBackend(steps, content, hash, authorized) {
            let response = {};
            let data = {
                steps: steps,
                content: content,
                hash: hash,
                authorized: authorized
            }
            try {
                response = await axios.put( '/final', data, this.requestConfig(this.dataToken));
                this.refreshToken(response);
                return true;
            }
            catch (error) {
                console.error(error);
                return false;
            }
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
            Cookies.remove('LongEssayToken');
            Cookies.remove('LongEssayHash');

            localStorage.setItem('backendUrl', this.backendUrl);
            localStorage.setItem('returnUrl', this.returnUrl);
            localStorage.setItem('userKey', this.userKey);
            localStorage.setItem('environmentKey', this.environmentKey);
            localStorage.setItem('dataToken', this.dataToken);
            localStorage.setItem('fileToken', this.fileToken);
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
            localStorage.setItem('timeOffset', this.timeOffset);
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
                localStorage.setItem('dataToken', this.dataToken);
            }

            if (response.headers['longessayfiletoken']) {
                this.fileToken = response.headers['longessayfiletoken'];
                localStorage.setItem('fileToken', this.fileToken);
            }
        },

        /**
         * Finalize the writing
         */
        async finalize(authorize) {

            const settingsStore = useSettingsStore();
            const taskStore = useTaskStore();
            const resourcesStore = useResourcesStore();
            const essayStore = useEssayStore();
            const layoutStore = useLayoutStore();

            if (authorize || essayStore.openSendings > 0) {
                if (!await this.saveFinalContentToBackend (
                    essayStore.unsentHistory,
                    essayStore.storedContent,
                    essayStore.storedHash,
                    authorize,
                )) {
                    this.showFinalizeFailure = true
                    this.showAuthorizeFailure = authorize
                    return;
                }
            }

            await settingsStore.clearStorage();
            await taskStore.clearStorage();
            await resourcesStore.clearStorage();
            await essayStore.clearStorage();
            await layoutStore.clearStorage();
            localStorage.clear();

            window.location = this.returnUrl;
        }
    }
})
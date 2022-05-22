import { defineStore } from 'pinia';
import localForage from "localforage";
import {useApiStore} from "./api";
import {useTaskStore} from "./task";

const storage = localForage.createInstance({
    storeName: "corrector-summary",
    description: "Summary data",
});

const checkInterval = 1000;     // time (ms) to wait for a new update check (e.g. 0.2s to 1s)
const sendInterval = 5000;      // time (ms) to wait for sending open savings to the backend

const startState = {
    
    // saved in storage
    storedContent: '',          // full content corresponding to the storage
    storedPoints: 0,
    storedGradeKey: '',
    isSent: true,               // stored content is sent to the server

    // not saved
    currentContent: '',         // directly mapped to the tiny editor, changes permanently !!!
    currentPoints: 0,
    currentGradeKey: '',
    lastCheck: 0,               // timestamp (ms) of the last check if an update needs a saving
    lastSave: 0,                // timestamp (ms) of the last save in the store
    lastSending: 0,             // timestamp (ms) of the last sending to the backend

}

let lockUpdate = 0;             // prevent updates during a processing
let lockSending = 0;            // prevent multiple sendings at the same time

/**
 * Essay store
 * Handles the written text of the user
 */
export const useSummaryStore = defineStore('summary',{

    state: () => {
        return startState;
    },

    getters: {
        openSending: (state) => state.isSent == false
    },

    actions: {

        async clearStorage() {
            try {
                await storage.clear();
            }
            catch (err) {
                console.log(err);
            }
        },

        /**
         * Load the full state from external data and save it to the storage
         * Called when the app is opened from the backend
         */
        async loadFromData(data) {
            lockUpdate = 1;

            try {
                this.$state = startState;
                this.currentContent = data.text ?? '';
                this.currentPoints = data.points ?? 0;
                this.currentGradeKey = data.grade_key ?? 0;
                this.storedContent = this.currentContent;
                this.storedPoints = this.currentPoints;
                this.storedGradeKey = this.currentGradeKey;
                this.isSent = true

                await storage.clear();
                await storage.setItem('storedContent', this.storedContent);
                await storage.setItem('storedPoints', this.storedPoints);
                await storage.setItem('storedGradeKey', this.storedGradeKey);
                await storage.setItem('isSent', this.isSent);

            } catch (err) {
                console.log(err);
            }

            lockUpdate = 0;
            setInterval(this.updateContent, checkInterval);
        },

        /**
         * Load the full state from the storage
         * Called when the page is reloaded 
         */
        async loadFromStorage() {
            lockUpdate = 1;

            try {
                this.$state = startState;

                this.storedContent =  await storage.getItem('storedContent') ?? '';
                this.storedPoints =  await storage.getItem('storedPoints') ?? 0;
                this.storedGradeKey =  await storage.getItem('storedGradeKey') ?? '';
                this.isSent =  await storage.getItem('isSent') ?? true;
                this.currentContent = this.storedContent;
                this.currentPoints = this.storedPoints;
                this.currentGradeKey = this.storedGradeKey;

            } catch (err) {
                console.log(err);
            }

            lockUpdate = 0;
            setInterval(this.updateContent, checkInterval);
        },


        /**
         * Update the stored content
         * Triggered from the editor component when the content is changed
         * Triggered every checkInterval
         * Push current content to the history
         * Save it in the browser storage
         * Call sending to the backend (don't wait)
         */
        async updateContent(fromEditor = false) {

            // avoid too many checks
            const currentTime = Date.now();
            if (currentTime - this.lastCheck < checkInterval) {
                return;
            }

            // avoid parallel updates
            // no need to wait because updateContent is called by interval
            // use post-increment for test-and set
            if (lockUpdate++) {
                return;
            }

            // don't accept changes after correction end
            const taskStore = useTaskStore();
            if (taskStore.correctionEndReached) {
                return;
            }

            try {
                const currentContent = this.currentContent + '';   // ensure it is not changed because content in state  is bound to tiny
                const currentPoints= this.currentPoints + 0;
                const currentGradeKey = this.currentGradeKey + '';

                if (currentContent != this.storedContent
                    || currentPoints != this.storedPoints
                    || currentGradeKey != this.storedGradeKey
                ) {
                    this.isSent = false;
                    this.storedContent = currentContent;
                    this.storedPoints = currentPoints;
                    this.storedGradeKey = currentGradeKey;

                    // save in storage
                    await storage.setItem('isSent', this.isSent);
                    await storage.setItem('storedContent', this.storedContent);
                    await storage.setItem('storedPoints', this.storedPoints);
                    await storage.setItem('storedGradeKey', this.storedGradeKey);

                    console.log(
                        "Save Change ",
                        "| Editor: ", fromEditor,
                        "| Duration:", Date.now() - currentTime, 'ms');

                }
                // set this here
                this.lastCheck = currentTime;

                // trigger sending to the backend (don't wait)
                this.sendUpdate();
            }
            catch(error) {
                console.error(error);
            }

            lockUpdate = 0;
        },

        /**
         * Send an update to the backend
         * Called from updateContent() without wait
         */
        async sendUpdate() {

            // everything is sent - don't send again
            if (this.isSent) {
                return;
            }

            // avoid too many sendings
            // sendUpdate is called from updateContent with the checkInterval
            if (Date.now() - this.lastSending < sendInterval) {
                return;
            }

            // avoid parallel sendings
            // no need to wait because sendUpdate is called by interval
            // use post-increment for test-and-set
            if (lockSending++) {
                return;
            }

            const data = {
                'text': this.storedContent,
                'points': this.storedPoints,
                'grade_key': this.storedGradeKey
            }

            const apiStore = useApiStore();
            if (await apiStore.saveSummaryToBackend(data)) {
                this.isSent = true;
                await storage.setItem('isSent', this.isSent);
            }

            lockSending = 0;
        },

        /**
         * Check if unsent savings are in the storage
         * (called from api store at initialisation)
         */
        async hasUnsentSavingInStorage() {
            this.isSent = await storage.getItem('isSent') ?? true;
            return !this.isSent;
        }
    }
});
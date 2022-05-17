import { defineStore } from 'pinia';
import localForage from "localforage";
import DiffMatchPatch from 'diff-match-patch';
import md5 from 'md5';
import {useApiStore} from "./api";
import {useTaskStore} from "./task";

const storage = localForage.createInstance({
    storeName: "essay",
    description: "Essay data",
});

const dmp = new DiffMatchPatch();

const checkInterval = 1000;     // time (ms) to wait for a new update check (e.g. 0.2s to 1s)
const saveInterval = 5000;      // maximum time (ms) to wait for a new save if content is changed
const sendInterval = 5000;      // maximum time (ms) to wait for sending open savings to the backend
const saveDistance = 10;        // maximum levenshtein distance to wait for a new save if content is changed
const maxDistance = 1000;       // maximum cumulated levenshtein distance of patches before a new full save is done


const startState = {
    
    // saved in storage
    storedContent: '',          // full content corresponding to the last stored writing step (which may be delta)
    storedHash: '',             // hash of the full stored content
    history: [],                // list of save objects for the writing steps
    lastStoredIndex: -1,        // history index of the last save in the store
    lastSentIndex: -1,          // history index of the last sending to the backend
    lastSentHash: '',           // hash of the full content of the last saving stored on the server

    // not saved
    currentContent: '',         // directly mapped to the tiny editor, changes permanently !!!
    sumOfDistances: 0,          // sum of levenshtine distances sice the last full save
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
export const useEssayStore = defineStore('essay',{

    state: () => {
        return startState;
    },

    getters: {
        hasHistory: (state) => state.history.length > 0,
        historyLength: (state) => state.history.length,
        openSendings: (state) => state.lastStoredIndex - state.lastSentIndex,

        unsentHistory(state) {
            let steps = [];
            let index = state.lastSentIndex + 1;
            while (index < state.history.length) {
                steps.push(state.history[index])
                index++;
            }
            return steps
        },


        /**
         * Format a timestamp as string like '2022-02-21 21:22:22'
         */
        formatTimestamp() {
            return (timestamp) => (new Date(timestamp)).toISOString().slice(0, 19).replace('T', ' ');
        },

        /**
         * Format an integer index with leading zeros like '000000001'
         * Used to generate the history keys in the storage
         */
        formatIndex() {
            return (index) => index.toString().padStart(9, '0');
        },

        /**
         * Make a hash from a string content and a unix timestamp
         * This is used to sign the editing steps
         * Content and timestamp are saved with a writing step, so verification on the server is possible
         * The combination of content and timestamp makes a hash unique for the task and user
         */
        makeHash() {
            return (content, timestamp) => md5(content + timestamp);
        }
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
         * Push a save object to the history in the state
         * @param saveObject
         * @param integer
         * @returns integer index of the pushed object
         */
        addToHistory(saveObject, distance = 0) {
            let lastIndex = this.history.push(saveObject) - 1;
            if (saveObject.is_delta) {
                this.sumOfDistances += distance;
            }
            else {
                this.sumOfDistances = 0;
            }
            return lastIndex
        },

        /**
         * Load the full state from external data and save it to the storage
         * Called when the app is opened from the backend
         */
        async loadFromData(data) {
            lockUpdate = 1;

            try {
                this.$state = startState;
                this.currentContent = data.content ?? '';
                this.storedContent = data.content ?? '';
                this.storedHash = data.hash ?? '';

                await storage.clear();
                await storage.setItem('storedContent', this.storedContent);
                await storage.setItem('storedHash', this.storedHash);

                let index = 0;
                while (index < data.steps.length) {
                    let entry = data.steps[index];
                    let saveObject = {
                        is_delta: entry.is_delta,
                        timestamp: entry.timestamp,
                        content: entry.content,
                        hash_before: entry.hash_before,
                        hash_after: entry.hash_after
                    }
                    this.addToHistory(saveObject);
                    await storage.setItem(this.formatIndex(index), saveObject);
                    index++;
                }

                this.lastStoredIndex = this.history.length -1;
                this.lastSentIndex = this.history.length -1;
                this.lastSentHash =  this.storedHash;
                await storage.setItem('lastStoredIndex', this.lastStoredIndex);
                await storage.setItem('lastSentIndex', this.lastSentIndex);
                await storage.setItem('lastSentHash',  this.lastSentHash);

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

                this.lastStoredIndex = await storage.getItem('lastStoredIndex') ?? -1;
                this.lastSentIndex = await storage.getItem('lastSentIndex') ?? -1;
                this.lastSentHash = await storage.getItem('lastSentHash') ?? '';
                this.storedContent =  await storage.getItem('storedContent') ?? '';
                this.storedHash =  await storage.getItem('storedHash') ?? '';
                this.currentContent = this.storedContent;

                let index = 0;
                while (index <= this.lastStoredIndex) {
                    let saveObject = await storage.getItem(this.formatIndex(index));
                    if (saveObject == null) {
                        break;
                    }
                    this.addToHistory(saveObject);
                    index++;
                }

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

            const apiStore = useApiStore();

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

            // don't accept changes after writing end
            const taskStore = useTaskStore();
            if (taskStore.writingEndReached) {
                return;
            }

            try {
                const currentContent = this.currentContent + '';   // ensure it is not changed because content in state  is bound to tiny
                let saveObject = null;

                //
                // create the save object if content has changed
                //
                if (currentContent != this.storedContent) {
                    const currentHash = this.makeHash(currentContent, apiStore.serverTime(currentTime));

                    // check for change and calculate the patch
                    let diffs = dmp.diff_main(this.storedContent, currentContent);
                    dmp.diff_cleanupEfficiency(diffs);
                    const distance = dmp.diff_levenshtein(diffs);
                    const difftext = dmp.patch_toText(dmp.patch_make(this.storedContent, diffs));

                    // be sure that the patch works
                    const result = dmp.patch_apply(dmp.patch_fromText(difftext), this.storedContent);

                    // make a full save if ...
                    if (this.history.length == 0                            // it is the first save
                        || difftext.length > currentContent.length          // or diff would be longer than full text
                        || this.sumOfDistances + distance > maxDistance     // or enough changes are saved as diffs
                        || result[0] != currentContent                      // or patch is wrong
                    ) {
                        saveObject = {
                            is_delta: 0,
                            timestamp: apiStore.serverTime(currentTime),
                            content: currentContent,
                            hash_before: this.storedHash,
                            hash_after: currentHash
                        }
                    }
                    // make a delta save if ...
                    else if (distance >= saveDistance                       // enouch changed since lase save
                        || currentTime - this.lastSave > saveInterval       // enogh time since last save
                    ) {
                        saveObject = {
                            is_delta: 1,
                            timestamp: apiStore.serverTime(currentTime),
                            content: difftext,
                            hash_before: this.storedHash,
                            hash_after: currentHash
                        }
                    }

                    //
                    // add the save object to the history
                    //
                    if (saveObject !== null) {

                        // push to history
                        this.lastStoredIndex = this.addToHistory(saveObject, distance);
                        this.lastSave = currentTime;
                        this.storedContent = currentContent;
                        this.storedHash = currentHash;

                        // save in storage
                        // 'content' in storage always corresponds to the the last history entry (which may be delta)
                        await storage.setItem('storedContent', this.storedContent);
                        await storage.setItem('storedHash', this.storedHash);
                        await storage.setItem(this.formatIndex(this.lastStoredIndex), saveObject);
                        await storage.setItem('lastStoredIndex', this.lastStoredIndex);

                        console.log(
                            "Delta:", saveObject.is_delta,
                            "| Distance (sum): ", distance, "(", this.sumOfDistances, ")",
                            "| Editor: ", fromEditor,
                            "| Duration:", Date.now() - currentTime, 'ms');
                    }
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

            let steps = [];
            let sentIndex = this.lastSentIndex;
            let sentHash = this.lastSentHash;
            let index = this.lastSentIndex + 1;

            while (index < this.history.length) {
                steps.push(this.history[index])
                sentHash = this.history[index].hash_after
                sentIndex = index++;                        // post increment
            }

            if (steps.length > 0) {
                const apiStore = useApiStore();
                if (await apiStore.saveWritingStepsToBackend(steps))
                {
                    this.lastSentIndex = sentIndex;
                    await storage.setItem('lastSentIndex', sentIndex);
                    await storage.setItem('lastSentHash', sentHash);
                }
                this.lastSending = Date.now();
            }

            lockSending = false;
        },

        /**
         * Check if unsent savings are in the storage
         * (called from api store at initialisation)
         */
        async hasUnsentSavingsInStorage() {
            this.lastStoredIndex = await storage.getItem('lastStoredIndex') ?? -1;
            this.lastSentIndex = await storage.getItem('lastSentIndex') ?? -1;

            return this.lastStoredIndex > this.lastSentIndex;
        },

        /**
         * Check if the current hash from the server is saved in the storage
         * (called from api store at initialisation)
         */
        async hasHashInStorage(hash) {
            this.lastSentHash = await storage.getItem('lastSentHash') ?? '';
            return hash == this.lastSentHash;
        }
    }
});
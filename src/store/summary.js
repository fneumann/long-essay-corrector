import { defineStore } from 'pinia';
import localForage from "localforage";
import {useApiStore} from "./api";
import {useTaskStore} from "./task";
import {useSettingsStore} from "./settings";
import {useLevelsStore} from "./levels";
import {useCorrectorsStore} from "./correctors";

const storage = localForage.createInstance({
    storeName: "corrector-summary",
    description: "Summary data",
});

// set check interval very short to update the grade level according the points
const checkInterval = 200;      // time (ms) to wait for a new update check (e.g. 0.2s to 1s)
const sendInterval = 5000;      // time (ms) to wait for sending open savings to the backend

const startState = {

    // saved in storage
    storedContent: '',          // full content corresponding to the storage
    storedPoints: null,
    storedGradeKey: '',
    storedIsAuthorized: false,
    isSent: true,               // stored content is sent to the server
    lastStored: 0,              // timestamp (ms) of the last storage

    // not saved
    currentContent: '',         // directly mapped to the tiny editor, changes permanently !!!
    currentPoints: null,
    currentGradeKey: '',
    currentIsAuthorized: false,
    lastCheck: 0,               // timestamp (ms) of the last check if an update needs a saving
    lastSendingTry: 0,          // timestamp (ms) of the last sending to the backend

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
        openSending: (state) => state.isSent == false,

        isAuthorized: (state) => state.currentIsAuthorized,

        isLastRating() {
            const correctorsStore = useCorrectorsStore();
            return correctorsStore.allAuthorized;
        },

        getStitchReasonText(state)  {
            const correctorsStore = useCorrectorsStore();
            let points = Array.from(correctorsStore.getAllPoints); // make a copy
            points.push(state.storedPoints);

            let min_points = null;
            let max_points = null;
            let sum_points = 0;
            let count_points = 0;
            let index = 0;
            while (index < points.length) {
                if (points[index] !== null) {
                    sum_points += points[index];
                    count_points++;

                    if (min_points === null || points[index] < min_points) {
                        min_points = points[index];
                    }
                    if (max_points === null || points[index] > max_points) {
                        max_points = points[index];
                    }
                }
                index++;
            }

            if (count_points == 0) {
                return '';
            }

            const settingsStore = useSettingsStore();
            if (settingsStore.stitch_when_distance) {
                if (max_points - min_points > settingsStore.max_auto_distance) {
                    return 'Der Punkteunterschied übersteigt ' + settingsStore.max_auto_distance + ' Punkte!';
                }
            }
            if (settingsStore.stitch_when_decimals) {
                let average = sum_points / count_points;
                if (Math.floor(average) < average) {
                    return 'Der Punktedurchschnitt ' + average + ' ist keine ganze Zahl!';
                }
            }

            return '';
        },

        currentGradeTitle(state) {
            if (state.currentGradeKey) {
                const levelsStore = useLevelsStore();
                let level = levelsStore.getLevel(state.currentGradeKey);
                if (level) {
                    return level.title;
                }
            }
            return 'ohne Notenstufe';
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
                this.currentIsAuthorized = data.is_authorized ?? false;

                if (this.currentGradeKey == '') {
                    this.updateGradeKeyFromPoints()
                }

                this.storedContent = this.currentContent;
                this.storedPoints = this.currentPoints;
                this.storedGradeKey = this.currentGradeKey;
                this.storedIsAuthorized = this.currentIsAuthorized;

                this.isSent = true
                this.lastStored = Date.now();
                this.showAuthorization = false

                await storage.clear();
                await storage.setItem('storedContent', this.storedContent);
                await storage.setItem('storedPoints', this.storedPoints);
                await storage.setItem('storedGradeKey', this.storedGradeKey);
                await storage.setItem('storedIsAuthorized', this.storedIsAuthorized);
                await storage.setItem('isSent', this.isSent);
                await storage.setItem('lastStored', this.lastStored);

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
                this.storedIsAuthorized =  await storage.getItem('storedIsAuthorized') ?? '';
                this.isSent =  await storage.getItem('isSent') ?? true;
                this.lastStored =  await storage.getItem('lastStored') ?? 0;
                this.currentContent = this.storedContent;
                this.currentPoints = this.storedPoints;
                this.currentGradeKey = this.storedGradeKey;
                this.currentIsAuthorized = this.storedIsAuthorized;

                if (this.currentGradeKey == '') {
                    this.updateGradeKeyFromPoints()
                }

            } catch (err) {
                console.log(err);
            }

            lockUpdate = 0;
            setInterval(this.updateContent, checkInterval);
        },

        /**
         * Update the grade key from the given points
         */
        async updateGradeKeyFromPoints() {
            const levelsStore = useLevelsStore();
            let level = levelsStore.getLevelForPoints(this.currentPoints);
            if (level) {
                this.currentGradeKey = level.key
            }
            else {
                this.currentGradeKey = '';
            }
        },

        /**
         * Update the stored content
         * Triggered from the editor component when the content is changed
         * Triggered every checkInterval
         * Push current content to the history
         * Save it in the browser storage
         * Call sending to the backend (don't wait)
         */
        async updateContent(fromEditor = false, trySend = true, force = false) {

            // don't update if authorized
            if (this.storedIsAuthorized) {
                return;
            }

            // avoid too many checks
            const currentTime = Date.now();
            if ((currentTime - this.lastCheck < checkInterval) && !force) {
                return;
            }

            // avoid parallel updates
            // no need to wait because updateContent is called by interval
            // use post-increment for test-and set
            if (lockUpdate++ && !force) {
                return;
            }

            // don't accept changes after correction end
            const taskStore = useTaskStore();
            if (taskStore.correctionEndReached) {
                return;
            }

            // limit the points
            const settingsStore = useSettingsStore();
            if (this.currentPoints < 0) {
                this.currentPoints = 0;
            }
            if (this.currentPoints > settingsStore.max_points) {
                this.currentPoints = settingsStore.max_points;
            }

            // set the grade key for the points
            if (this.currentPoints != this.storedPoints) {
                this.updateGradeKeyFromPoints()
            }

            try {
                const currentContent = this.currentContent + '';   // ensure it is not changed because content in state  is bound to tiny
                const currentPoints = this.currentPoints + 0;
                const currentGradeKey = this.currentGradeKey + '';
                const currentIsAuthorized = this.currentIsAuthorized;

                if (currentContent != this.storedContent
                    || currentPoints != this.storedPoints
                    || currentGradeKey != this.storedGradeKey
                    || currentIsAuthorized != this.storedIsAuthorized
                ) {
                    this.isSent = false;
                    this.storedContent = currentContent;
                    this.storedPoints = currentPoints;
                    this.storedGradeKey = currentGradeKey;
                    this.storedIsAuthorized = currentIsAuthorized;
                    this.lastStored = Date.now();

                    // save in storage
                    await storage.setItem('isSent', this.isSent);
                    await storage.setItem('storedContent', this.storedContent);
                    await storage.setItem('storedPoints', this.storedPoints);
                    await storage.setItem('storedGradeKey', this.storedGradeKey);
                    await storage.setItem('storedIsAuthorized', this.storedIsAuthorized);
                    await storage.setItem('lastStored', this.lastStored);

                    console.log(
                        "Save Change ",
                        "| Editor: ", fromEditor,
                        "| Duration:", Date.now() - currentTime, 'ms');

                }
                // set this here
                this.lastCheck = currentTime;

                // trigger sending to the backend (don't wait)
                if (trySend) {
                    this.sendUpdate();
                }
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
        async sendUpdate(force = false) {

            // everything is sent - don't send again
            if (this.isSent && !force) {
                return;
            }

            // avoid too many sendings
            // sendUpdate is called from updateContent with the checkInterval
            if ((Date.now() - this.lastSendingTry < sendInterval) && !force) {
                return;
            }

            // avoid parallel sendings
            // no need to wait because sendUpdate is called by interval
            // use post-increment for test-and-set
            if (lockSending++ && !force) {
                return;
            }

            const data = {
                'text': this.storedContent,
                'points': this.storedPoints,
                'grade_key': this.storedGradeKey,
                'is_authorized': this.storedIsAuthorized
            }

            const apiStore = useApiStore();
            if (await apiStore.saveSummaryToBackend(data)) {
                this.isSent = true;
                await storage.setItem('isSent', this.isSent);
            }

            this.lastSendingTry = Date.now();
            lockSending = 0;
        },

        /**
         * Set the summary as authorized and save it
         */
        async setAuthorized() {
            this.currentIsAuthorized = true;
            this.showAuthorization = false;
            // force a sending of the authorized state
            await this.updateContent(false, false, true);
            await this.sendUpdate(true);
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

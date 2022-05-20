import { defineStore } from 'pinia';
import localForage from "localforage";
import {useApiStore} from "./api";

const storage = localForage.createInstance({
    storeName: "corrector-task",
    description: "Task data",
});



/**
 * Task Store
 * Handles settings of the writing task
 */
export const useTaskStore = defineStore('task',{
    state: () => {
        return {
            // saved in storage
            title: null,            // title of the task - shown in the app bar
            instructions: null,     // instructions - shown in the left column
            correction_end: null,   // correction end (sec in server time) - accept no writing step after this time

            // not saved in storage
            remaining_time: null     // remaining writing time in seconds (updated per interval)
        }
    },

    getters: {
        hasCorrectionEnd: (state) => !!state.correction_end,
        correctionEndReached: (state) => state.remaining_time === 0,
    },

    actions: {
        setData(data) {
            this.title = data.title;
            this.instructions = data.instructions;
            this.correction_end = data.correction_end;
        },

        async clearStorage() {
            try {
                await storage.clear();
            }
            catch (err) {
                console.log(err);
            }
        },

        async loadFromStorage() {
            try {
                const data = await storage.getItem('task');
                this.setData(data);
            } catch (err) {
                console.log(err);
            }

            this.updateRemainingTime();
            setInterval(this.updateRemainingTime, 1000);
        },

        async loadFromData(data) {
            try {
                await storage.setItem('task', data);
                this.setData(data);
            } catch (err) {
                console.log(err);
            }

            this.updateRemainingTime();
            setInterval(this.updateRemainingTime, 1000);
        },

        /**
         * Update the remaining writing time (called by interval)
         */
        updateRemainingTime() {
            const apiStore = useApiStore();

            if (this.writing_end) {
                this.remaining_time = Math.max(0, this.correction_end - apiStore.serverTime(Date.now()));
            }
            else {
                this.remaining_time = null;
            }

            if (this.correctionEndReached) {
                apiStore.review = true;
            }
        }
    }
});
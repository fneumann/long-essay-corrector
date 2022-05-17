import { defineStore } from 'pinia';
import localForage from "localforage";
import {useApiStore} from "./api";

const storage = localForage.createInstance({
    storeName: "task",
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
            writer_name: null,      // name of the writer - shown in the app bar
            instructions: null,     // instructions - shown in the left column
            writing_end: null,      // writung end (sec in server time) - accept no writing step after this time

            // not saved in storage
            remaining_time: null     // remaining writing time in seconds (updated per interval)
        }
    },

    getters: {
        hasWritingEnd: (state) => !!state.writing_end,
        writingEndReached: (state) => state.remaining_time === 0,
    },

    actions: {
        setData(data) {
            this.title = data.title;
            this.instructions = data.instructions;
            this.writer_name = data.writer_name;
            this.writing_end = data.writing_end;
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
                this.remaining_time = Math.max(0, this.writing_end - apiStore.serverTime(Date.now()));
            }
            else {
                this.remaining_time = null;
            }

            if (this.writingEndReached) {
                apiStore.review = true;
            }
        }
    }
});
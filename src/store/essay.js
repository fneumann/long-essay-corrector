import { defineStore } from 'pinia';
import localForage from "localforage";

const storage = localForage.createInstance({
    storeName: "corrector-essay",
    description: "Essay data",
});

/**
 * Essay Store
 * Handles the essay to be corrected
 */
export const useEssayStore = defineStore('essay',{
    state: () => {
        return {
            // saved in storage
            text: null,             // processed essay text
            started: null,          // unix timestamp of writing start
            ended: null,            // unix timestamp of writing end
            authorized: null        // essay is authorized by the writer
        }
    },

    actions: {
        setData(data) {
            this.text = data.text;
            this.started = data.started;
            this.ended = data.ended;
            this.authorized = data.authorized;
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
                const data = await storage.getItem('settings');
                this.setData(data);
            } catch (err) {
                console.log(err);
            }
        },

        async loadFromData(data) {
            try {
                await storage.setItem('settings', data);
                this.setData(data);
            } catch (err) {
                console.log(err);
            }
        }
    }
});
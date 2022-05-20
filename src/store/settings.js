import { defineStore } from 'pinia';
import localForage from "localforage";

const storage = localForage.createInstance({
    storeName: "corrector-settings",
    description: "Settings data",
});

/**
 * Settings Store
 * Handles the editor settings of the writing task
 */
export const useSettingsStore = defineStore('settings',{
    state: () => {
        return {
            // saved in storage
            mutual_visibility: false,       // corrector sees othercorrectors
            multi_color_highlight: false,   // text can be highlightes in multi colors
            max_points: 0,                  // maximum points that can be given
        }
    },

    actions: {
        setData(data) {
            this.mutual_visibility = data.mutual_visibility;
            this.multi_color_highlight = data.multi_color_highlight;
            this.max_points = data.max_points;
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
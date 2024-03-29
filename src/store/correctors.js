import { defineStore } from 'pinia';
import localForage from "localforage";

const storage = localForage.createInstance({
    storeName: "corrector-correctors",
    description: "Correctors data",
});

/**
 * Correctors Store
 */
export const useCorrectorsStore = defineStore('correctors',{
    state: () => {
        return {
            // saved in storage
            keys: [],               // list of string keys
            correctors: [],         // list of corrector objects
            activeKey: ''           // key of the active corrector
        }
    },


    getters: {
        hasCorrectors: (state) => state.correctors.length > 0,

        activeTitle(state) {
          const corrector = state.correctors.find(element => element.key == state.activeKey);
          return corrector ? 'Korrektur von ' + corrector.title : ""
        },

        getCorrector(state) {
            return (key) => state.items.find(element => element.key == key)
        },

        isActive(state) {
            return (corrector) => state.activeKey == corrector.key
        },

        allAuthorized(state) {
            let index = 0;
            while (index < state.correctors.length) {
                let corrector = state.correctors[index];
                if (!corrector.is_authorized) {
                    return false;
                }
                index++;
            }
            return true;
        },

        getAllPoints(state) {
            let points = [];
            let index = 0;
            while (index < state.correctors.length) {
                let corrector = state.correctors[index];
                points.push(corrector.points);
                index++;
            }
            return points;
        },

       minPoints(state) {
            let points = null;
            let index = 0;
            while (index < state.correctors.length) {
                let corrector = state.correctors[index];
                if (points === null || corrector.points < points) {
                    points = corrector.points;
                }
                index++;
            }
            return points;
        },

        maxPoints(state) {
            let points = null;
            let index = 0;
            while (index < state.correctors.length) {
                let corrector = state.correctors[index];
                if (points === null || corrector.points > points) {
                    points = corrector.points;
                }
                index++;
            }
            return points;
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

        async loadFromStorage() {
            try {
                const keys = await storage.getItem('correctorKeys');
                if (keys) {
                    this.keys =  JSON.parse(keys);
                }
                this.activeKey = await storage.getItem('activeKey') ?? [];
                this.correctors = [];

                let index = 0;
                while (index < this.correctors.length) {
                    let corrector = await storage.getItem(this.keys[index]);
                    this.correctors.push(corrector);
                    index++;
                }

            } catch (err) {
                console.log(err);
            }
        },

        async loadFromData(data) {

            try {
                await storage.clear();

                this.keys = [];
                this.correctors = [];
                this.activeKey = '';

                let index = 0;
                while (index < data.length) {
                    let corrector = data[index];
                    this.correctors.push(corrector);
                    this.keys.push(corrector.key);
                    await storage.setItem(corrector.key, corrector);
                    index++;
                }
                if (this.keys.length > 0) {
                    this.activeKey = this.keys[0];
                }

                await storage.setItem('correctorKeys', JSON.stringify(this.keys));
                await storage.setItem('activeKey', this.activeKey);
            }
            catch (err) {
                console.log(err);
            }
        },

        async selectCorrector(corrector) {
            this.activeKey = corrector.key;
            await storage.setItem('activeKey', this.activeKey);
        }
    }
});

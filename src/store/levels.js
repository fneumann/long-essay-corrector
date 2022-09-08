import { defineStore } from 'pinia';
import localForage from "localforage";

const storage = localForage.createInstance({
    storeName: "corrector-levels",
    description: "Grade level data",
});

/**
 * Resources Store
 */
export const useLevelsStore = defineStore('levels',{
    state: () => {
        return {
            // saved in storage
            keys: [],               // list of string keys
            levels: [],             // list of level objects
        }
    },


    getters: {
        hasLevels: (state) => state.levels.length > 0,

        getLevel(state) {
            return (key) => state.levels.find(element => element.key == key)
        },

        getLevelForPoints(state) {
            return function (points) {
                let level = null;
                let last_points = 0;
                for (let i = 0; i < state.levels.length; i++) {
                    if (state.levels[i].min_points <= points
                    && state.levels[i].min_points >= last_points) {
                        level = state.levels[i];
                        last_points = level.points;
                    }
                }
                return level;
            }
        },
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
                const keys = await storage.getItem('levelKeys');
                if (keys) {
                    this.keys =  JSON.parse(keys);
                }
                this.levels = [];

                let index = 0;
                while (index < this.keys.length) {
                    let level = await storage.getItem(this.keys[index]);
                    this.levels.push(level);
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
                this.levels = [];

                let index = 0;
                while (index < data.length) {
                    let level = data[index];
                    this.levels.push(level);
                    this.keys.push(level.key);
                    await storage.setItem(level.key, level);
                    index++;
                }

                await storage.setItem('levelKeys', JSON.stringify(this.keys));
            }
            catch (err) {
                console.log(err);
            }
        }
    }
});
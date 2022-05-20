import { defineStore } from 'pinia';
import localForage from "localforage";

const storage = localForage.createInstance({
    storeName: "corrector-items",
    description: "Items data",
});

/**
 * Items Store
 */
export const useItemsStore = defineStore('items',{
    state: () => {
        return {
            // saved in storage
            keys: [],               // list of string keys
            items: [],              // list of item objects
        }
    },


    getters: {
        hasItems: (state) => state.keys.length > 0,
        firstKey: (state) => state.keys.length > 0 ? state.keys[0] : '',
        lastKey: (state) => state.keys.length > 0 ? state.keys[state.keys.length -1] : '',

        previousKey(state) {
            return function (key) {
                for (let i = 1; i < state.keys.length; i++) {
                    if (state.keys[i] == key) {
                        return state.keys[i - 1];
                    }
                }
                return '';
            }
        },

        nextKey(state) {
            return function (key) {
                for (let i = 0; i < state.keys.length - 1; i++) {
                    if (state.keys[i] == key) {
                        return state.keys[i + 1];
                    }
                }
                return '';
            }
        },

        getItem(state) {
            return (key) => state.items.find(element => element.key == key)
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
                const keys = await storage.getItem('itemKeys');
                if (keys) {
                    this.keys =  JSON.parse(keys);
                }
                this.items = [];

                let index = 0;
                while (index < this.items.length) {
                    let item = await storage.getItem(this.keys[index]);
                    this.items.push(item);
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
                this.items = [];

                let index = 0;
                while (index < data.length) {
                    let item = data[index];
                    this.items.push(item);
                    this.keys.push(item.key);
                    await storage.setItem(item.key, item);
                    index++;
                }

                await storage.setItem('itemKeys', JSON.stringify(this.keys));
            }
            catch (err) {
                console.log(err);
            }
        },
    }
});
import { defineStore } from 'pinia';
import localForage from "localforage";
import {useApiStore} from "./api";

const storage = localForage.createInstance({
    storeName: "resources",
    description: "Resource data",
});

/**
 * Resources Store
 */
export const useResourcesStore = defineStore('resources',{
    state: () => {
        return {
            // saved in storage
            keys: [],               // list of string keys
            resources: [],          // list of resource objects
            activeKey: ''           // key of the active resource
        }
    },


    getters: {
        hasResources: (state) => state.resources.length > 0,

        activeTitle(state) {
          const resource = state.resources.find(element => element.key == state.active_key);

          return resource ? resource.title : ""
        },

        getResource(state) {
            return (key) => state.resources.find(element => element.key == key)
        },

        isActive(state) {
            return (resource) => state.active_key == resource.key
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
                const keys = await storage.getItem('resourceKeys');
                if (keys) {
                    this.keys =  JSON.parse(keys);
                }
                this.activeKey = await storage.getItem('activeKey') ?? [];
                this.resources = [];

                let index = 0;
                while (index < this.keys.length) {
                    let resource = await storage.getItem(this.keys[index]);
                    this.resources.push(resource);
                    index++;
                }

            } catch (err) {
                console.log(err);
            }
        },

        async loadFromData(data) {
            const apiStore = useApiStore();

            try {
                await storage.clear();

                this.keys = [];
                this.resources = [];

                let index = 0;
                while (index < data.length) {
                    let resource = data[index];
                    resource.url = apiStore.resourceUrl(resource.key);
                    this.resources.push(resource);
                    this.keys.push(resource.key);
                    await storage.setItem(resource.key, resource);
                    index++;
                }

                await storage.setItem('resourceKeys', JSON.stringify(this.keys));
                await storage.setItem('activeKey', this.activeKey);
            }
            catch (err) {
                console.log(err);
            }
        },

        async selectResource(resource) {
            this.active_key = resource.key;
            await storage.setItem('activeKey', this.activeKey);
        }
    }
});
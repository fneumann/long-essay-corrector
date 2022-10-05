import { defineStore } from 'pinia';
import localForage from "localforage";
import {useApiStore} from "./api";
import axios from 'axios'

const storage = localForage.createInstance({
    storeName: "corrector-resources",
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
          const resource = state.resources.find(element => element.key == state.activeKey);

          return resource ? resource.title : ""
        },

        getResource(state) {
            return (key) => state.resources.find(element => element.key == key)
        },

        isActive(state) {
            return (resource) => state.activeKey == resource.key
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

                await this.loadFiles();
            }
            catch (err) {
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

                await this.loadFiles();
            }
            catch (err) {
                console.log(err);
            }
        },

        async selectResource(resource) {
            this.activeKey = resource.key;
            await storage.setItem('activeKey', this.activeKey);
        },

        /**
         * Preload file resources (workaround until service worker is implemented)
         * The Resources Component will only show PDF resources when they are immediately available
         * This preload forces the resources being in the browser cache
         *
         * https://stackoverflow.com/a/50387899
         */
        async loadFiles() {
            let index = 0;
            while (index < this.keys.length) {
                let resource = this.getResource(this.keys[index]);
                let response = null;
                if (resource.type == 'file') {
                    try {
                        console.log('preload ' + resource.title + '...');
                        response = await axios( resource.url, {responseType: 'blob', timeout: 60000});
                        resource.objectUrl = URL.createObjectURL(response.data)
                        console.log('finished. ');
                    }
                    catch (error) {
                        console.error(error);
                        return false;
                    }
                }
                index++;
            }
        }

    }
});
import { defineStore } from 'pinia';
import localForage from "localforage";
import {useApiStore} from "./api";
import {useLevelsStore} from '@/store/levels';

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
            authorized: null,       // essay is authorized by the writer

            // for stitch decision
            correction_finalized: null,
            final_points: null,
            stitch_comment: null
        }
    },

    getters: {

        isFinalized: (state) => state.correction_finalized,

        grade: (state) => {
            const levelsStore = useLevelsStore();
            let level = levelsStore.getLevelForPoints(state.final_points);
            if (level !== null) {
                return level.title
            }
            return '';
        },
        gradeKey: (state) => {
            const levelsStore = useLevelsStore();
            let level = levelsStore.getLevelForPoints(state.final_points);
            if (level !== null) {
                return level.key
            }
            return '';
        }
    },

    actions: {
        setData(data) {
            this.text = data.text;
            this.started = data.started;
            this.ended = data.ended;
            this.authorized = data.authorized;
            this.correction_finalized = data.correction_finalized;
            this.final_points = data.final_points;
            this.stitch_comment = data.stitch_comment;
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
        },


        async saveStitchDecision() {

            const apiStore = useApiStore();
            const correction_finalized = apiStore.serverTime(Date.now());
            const data = {
                'final_points': this.final_points,
                'stitch_comment': this.stitch_comment,
                'grade_key': this.gradeKey,
                'correction_finalized' : correction_finalized,
            }

            if (await apiStore.saveStitchDecisionToBackend(data)) {
                this.correction_finalized = correction_finalized;
                await storage.setItem('final_points', this.final_points);
                await storage.setItem('stitch_comment', this.stitch_comment);
                await storage.setItem('correction_finalized', this.correction_finalized);
            }
        },
    }
});

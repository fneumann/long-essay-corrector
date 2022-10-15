<script setup>
import {useCorrectorsStore} from '@/store/correctors';
import {useLevelsStore} from '@/store/levels';
import {useSettingsStore} from '@/store/settings';
const correctorsStore = useCorrectorsStore();
const levelsStore = useLevelsStore();
const settingsStore = useSettingsStore();

</script>

<template>
  <div class="appCorrectorWrapper">
    <template v-for="corrector in correctorsStore.correctors" :key="corrector.key">
      <div class="appCorrector" v-show="correctorsStore.isActive(corrector)" v-html="corrector.text">
      </div>
      <div class="appRatingContainer">

        <label for="appSummaryPoints">Punkte: </label>
        <input disabled id="appSummaryPoints" class="appRatingControl" type="number" min="0" :max="settingsStore.max_points" v-model="corrector.points" />

        <label for="appSummaryGradeKey">Bewertung: </label>
        <select disabled id="appSummaryGradeKey" class="appRatingControl" v-model="corrector.grade_key">
          <option disabled value="">Bitte wählen:</option>
          <option v-for="level in levelsStore.levels" :key="level.key" :value="level.key">{{level.title}}</option>
        </select>
      </div>

    </template>
  </div>
</template>


<style scoped>



.appCorrectorWrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}


.appCorrector {
  flex-grow: 1;
  padding: 20px;
  border: 1px solid #cccccc;
  overflow-y: scroll;
}

.appRatingContainer {
  padding-top: 10px;
}

.appRatingControl {
  border: 1px solid lightgray;
  margin-left: 10px;
  margin-right: 10px;
  padding: 5px;
}

</style>
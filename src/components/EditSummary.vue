<script setup>
/*
* Import TinyMCE
*/
import 'tinymce';
// Default icons are required for TinyMCE 5.3 or above
import 'tinymce/icons/default';
// A theme is also required
import 'tinymce/themes/silver';
// Import the skin
import 'tinymce/skins/ui/oxide/skin.css';
/* Import plugins */
import 'tinymce/plugins/lists';
import 'tinymce/plugins/charmap';
/* Import tiny vue integration */
import Editor from '@tinymce/tinymce-vue'

import {useSummaryStore} from '@/store/summary';
import {useLevelsStore} from '@/store/levels';
import {useSettingsStore} from '@/store/settings';
const summaryStore = useSummaryStore();
const levelsStore = useLevelsStore();
const settingsStore = useSettingsStore();

function toolbar() {
  switch ('full')
  {
    case 'full':
      return 'undo redo | formatselect | bold italic underline | bullist numlist | removeformat | charmap';
    case 'medium':
      return 'undo redo | bold italic underline | bullist numlist | removeformat | charmap';
    case 'minimal':
      return 'undo redo | bold italic underline | removeformat | charmap';
    case 'none':
    default:
      return 'undo redo | charmap';
  }
}

// Used for retrieving the editor instance using the tinymce.get('ID') method.
const id = "summary";
</script>

<template>
  <div class="appSummaryContainer">
    <editor
        :id="id"
        v-model="summaryStore.currentContent"
        @change="summaryStore.updateContent(true)"
        @keyup="summaryStore.updateContent(true)"
        api-key="no-api-key"
        :init="{
        height: '100%',
        menubar: false,
        plugins: 'lists charmap',
        toolbar: toolbar(),
        custom_undo_redo_levels: 10
       }"
    />
  </div>
  <div class="appRatingContainer">

    <label for="appSummaryPoints">Punkte: </label>
    <input id="appSummaryPoints" class="appRatingControl" type="number" min="0" :max="settingsStore.max_points" v-model="summaryStore.currentPoints" />

    <label for="appSummaryGradeKey">Bewertung: </label>
    <select id="appSummaryGradeKey" class="appRatingControl" v-model="summaryStore.currentGradeKey">
      <option disabled value="">Bitte wählen:</option>
      <option v-for="level in levelsStore.levels" :key="level.key" :value="level.key">{{level.title}}</option>
    </select>
  </div>
</template>

<style>
.tox-statusbar {
  display: none!important;
}

.appSummaryContainer {
  height: calc(100% - 50px);
}

.appRatingContainer {
  height: 50px;
  padding-top: 10px;
}

.appRatingControl {
  border: 1px solid lightgray;
  margin-left: 10px;
  margin-right: 10px;
  padding: 5px;
}
</style>
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

/* Import content css */
import contentUiCss from 'tinymce/skins/ui/oxide/content.css';
import contentLocalCss from '@/styles/content.css';

/* Import plugins */
import 'tinymce/plugins/lists';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/paste';
/* Import tiny vue integration */
import Editor from '@tinymce/tinymce-vue'

import {useApiStore} from '@/store/api';
import {useTaskStore} from '@/store/task';
import {useSummaryStore} from '@/store/summary';
import {useLevelsStore} from '@/store/levels';
import {useSettingsStore} from '@/store/settings';
import {useItemsStore} from '@/store/items';

const apiStore = useApiStore();
const taskStore = useTaskStore();
const summaryStore = useSummaryStore();
const levelsStore = useLevelsStore();
const settingsStore = useSettingsStore();
const itemsStore = useItemsStore();

function toolbar() {
  switch ('full') // corrector always has full formatting options
  {
    case 'full':
      return 'undo redo | formatselect | bold italic underline | bullist numlist | removeformat | charmap | paste';
    case 'medium':
      return 'undo redo | bold italic underline | bullist numlist | removeformat | charmap | paste';
    case 'minimal':
      return 'undo redo | bold italic underline | removeformat | charmap | paste';
    case 'none':
    default:
      return 'undo redo | charmap |paste';
  }
}

/**
 * @see https://www.tiny.cloud/docs/configure/content-filtering/#valid_elements
 */
function validElements() {
  switch ('full') // corrector always has full formatting options
  {
    case 'full':
      return 'p/div,br,strong/b,em/i,u,ol,ul,li,h1,h2,h3,h4,h5,h6,pre';
    case 'medium':
      return 'p/div,br,strong/b,em/i,u,ol,ul,li';
    case 'minimal':
      return 'p/div,p/li,br,strong/b,em/i,u';
    case 'none':
    default:
      return 'p/div,p/li,br';
  }
}

/**
 * @see https://www.tiny.cloud/docs/configure/content-formatting/#formats
 */
function formats() {
  return {
    underline: {inline: 'u', remove: 'all'}
  }
}

async function setAuthorizedAndContinue() {
  await summaryStore.setAuthorized();
  if (!summaryStore.isSent) {
    apiStore.setShowSendFailure(true);
  }
  else {
    let newKey = itemsStore.nextKey(apiStore.itemKey);
    if (newKey != '') {
      apiStore.loadItemFromBackend(newKey);
    }
  }
}

async function setAuthorizedAndClose() {
  await summaryStore.setAuthorized();
  if (!summaryStore.isSent) {
    apiStore.setShowSendFailure(true);
  }
  else {
    window.location = apiStore.returnUrl;
  }
}

// Used for retrieving the editor instance using the tinymce.get('ID') method.
const id = "summary";
</script>

<template>
  <div class="appSummaryWrapper">
    <div v-show="!summaryStore.storedIsAuthorized" class="appSummaryContainer">
      <editor
          :id="id"
          v-model="summaryStore.currentContent"
          @change="summaryStore.updateContent(true)"
          @keyup="summaryStore.updateContent(true)"
          api-key="no-api-key"
          :init="{
            height: '100%',
            menubar: false,
            plugins: 'lists charmap paste',
            toolbar: toolbar(),
            valid_elements: validElements(),
            formats: formats(),
            custom_undo_redo_levels: 10,
            skin: false,                      // avoid 404 errors for skin css files
            content_css: false,               // avoid 404 error for content css file
            content_style: contentUiCss.toString() + '\n' + contentLocalCss.toString(),
            paste_block_drop: true
       }"
      />
    </div>
    <div v-show="summaryStore.storedIsAuthorized" class="appSummaryContainer" v-html="summaryStore.currentContent">
    </div>

    <div class="appRatingContainer">

      <label for="appSummaryPoints">Punkte: </label>
      <input :disabled="summaryStore.storedIsAuthorized" id="appSummaryPoints" class="appRatingControl" type="number" min="0" :max="settingsStore.max_points" v-model="summaryStore.currentPoints" />

      <label for="appSummaryGradeKey">( {{ summaryStore.currentGradeTitle }} ) &nbsp;</label>


      <!--
      <select :disabled="summaryStore.storedIsAuthorized" id="appSummaryGradeKey" class="appRatingControl" v-model="summaryStore.currentGradeKey">
        <option disabled value="">Bitte wählen:</option>
        <option v-for="level in levelsStore.levels" :key="level.key" :value="level.key">{{level.title}}</option>
      </select>
      -->

      <v-btn v-show="!summaryStore.storedIsAuthorized" :disabled="!taskStore.authorization_allowed" @click="summaryStore.showAuthorization=true">
        <span>Autorisieren...</span>
      </v-btn>

      <span v-show="summaryStore.storedIsAuthorized">(autorisiert)</span>

      <v-dialog persistent v-model="summaryStore.showAuthorization">
        <v-card>
          <v-card-text>
            <p v-show="summaryStore.isLastRating && summaryStore.getStitchReasonText != '' ">
              <strong>Ihre Punktevergabe wird einen Stichentscheid erfordern:</strong>
              <br>{{ summaryStore.getStitchReasonText }}
            </p>
            <br>
            <p>
              Durch die Autorisierung wird Ihre Korrektur festgeschrieben. Sie können sie anschließend nicht mehr ändern. Möchten Sie Ihre Korrektur autorisieren?
            </p>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="setAuthorizedAndContinue()">
              <v-icon left icon="mdi-check"></v-icon>
              <span>Autorisieren und Weiter</span>
            </v-btn>
            <v-btn @click="setAuthorizedAndClose()">
              <v-icon left icon="mdi-check"></v-icon>
              <span>Autorisieren und Schließen</span>
            </v-btn>
            <v-btn @click="summaryStore.showAuthorization=false">
              <v-icon left icon="mdi-close"></v-icon>
              <span>Abbrechen</span>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </div>
  </div>
</template>

<style>
.tox-statusbar {
  display: none!important;
}

.appSummaryWrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.appSummaryContainer {
  flex-grow: 1;
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
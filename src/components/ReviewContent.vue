<script setup>
import {useApiStore} from '@/store/api';
import {useTaskStore} from '@/store/task';
import {useEssayStore} from '@/store/essay';
const apiStore = useApiStore();
const essayStore = useEssayStore();
const taskStore = useTaskStore();


</script>

<template>
  <v-main fill-height>
    <div class="container">

      <div  class="column">
        <div class="col-header bg-grey-lighten-4" v-show="taskStore.writingEndReached">
          <h2 class="text-h6">Ihre Bearbeitungszeit ist beendet</h2>
          <p>Es ist keine weitere Eingabe möglich. Bitte überprüfen Sie, ob Sie den Text in dieser Form zur Bewertung abgeben möchten.</p>
        </div>
        <div class="col-header bg-grey-lighten-4" v-show="!taskStore.writingEndReached">
          <h2 class="text-h6">Abgabe-Text</h2>
          <p>Bitte überprüfen Sie, ob Sie den Text in dieser Form zur Bwertung abgeben möchten.
            Nach der Abgabe ist keine weitere Bearbeitung mehr möglich!</p>
        </div>

        <div class="col-content">
          <div class="review-text" v-html="essayStore.storedContent"></div>
        </div>

        <div class="col-footer text-right bg-grey-lighten-4" >
          <v-btn class="ma-2" @click="apiStore.finalize(true)" color="secondary" >
            <v-icon icon="mdi-file-send-outline"></v-icon>
            <span>Zur Bewertung abgeben</span>
          </v-btn>
          <v-btn class="ma-2" @click="apiStore.finalize(false)" v-show="taskStore.writingEndReached">
            <v-icon icon="mdi-logout-variant"></v-icon>
            <span>Ohne Abgabe beenden</span>
          </v-btn>
          <v-btn class="ma-2" @click="apiStore.review=false" v-show="!taskStore.writingEndReached">
            <v-icon icon="mdi-file-edit-outline"></v-icon>
            <span>Weiter bearbeiten</span>
          </v-btn>
        </div>
      </div>
    </div>

    <v-dialog persistent v-model="apiStore.showFinalizeFailure">
      <v-card>
        <v-card-text>
          <p v-show="apiStore.showAuthorizeFailure">Beim Speichern der Abgabe ist ein Fehler aufgetreten.
            Bitte versuchen Sie es später noch einmal.</p>
          <p v-show="!apiStore.showFinalizeFailure">Beim Speichern Ihrer letzten Änderungen ist ein Fehler aufgetreten.
            Bitte versuchen Sie es später noch einmal.</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="apiStore.showFinalizeFailure=false">
            <v-icon left icon="mdi-close"></v-icon>
            <span>Später versuchen</span>
          </v-btn>
          <v-btn :href="apiStore.returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>Ohne Speichern beenden</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-main>
</template>



<style scoped>

/* Structure */

.container {
  position: fixed;
  height: calc((100% - 50px) - 50px);
  width: 100%;
  display: flex;
}

.column {
  flex: 1;
}

.col-header {
  height: 100px;
  width: 100%;
  padding: 10px;
  padding-left: 20px;
}

.col-content {
  height: calc(((100% - 100px)) - 70px);
  background-color: white;
  overflow-y: scroll;
  width: 100%;
  padding:10px;
  padding-left: 20px;
  font-family: Serif;
}

.col-footer {
  position: fixed;
  bottom: 48px;
  padding:20px;
  width: 100%;
  background-color: lightgray;
}

.review-text {
  max-width:80em;
}

</style>
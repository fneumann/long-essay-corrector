<script setup>
import {useApiStore} from '@/store/api';
const apiStore = useApiStore();
</script>

<template>
  <v-main fill-height>

    <v-app-bar elevation="1" color="white" density="compact" >
      <p>Lade Daten...</p>
      <v-spacer></v-spacer>
      <v-btn :href="apiStore.returnUrl">
        <v-icon left icon="mdi-logout-variant"></v-icon>
        <span>Meine Korrekturen</span>
      </v-btn>
    </v-app-bar>

    <v-dialog persistent v-model="apiStore.showInitFailure">
      <v-card>
        <v-card-text>
          <p>Beim Laden der Basisdaten ist ein Fehler aufgetreten. Die Anwendung kann nicht gestartet werden.</p>
        </v-card-text>
        <v-card-actions>
          <v-btn :href="apiStore.returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>Beenden</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog persistent v-model="apiStore.showInitFailure">
      <v-card>
        <v-card-text>
          <p>Beim Laden der zu korrigierenden Abgabe ist ein Fehler aufgetreten. Die Anwendung kann nicht gestartet werden.</p>
        </v-card-text>
        <v-card-actions>
          <v-btn :href="apiStore.returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>Beenden</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog persistent v-model="apiStore.showDataReplaceConfirmation">
      <v-card>
        <v-card-text>
          <p>In Ihrem Browser sind Eingaben eines anderen Benutzers oder einer anderen Aufgabe vorhanden, die noch nicht übertragen wurden.
            Durch das Laden werden diese Eingaben gelöscht.</p>
          <p>Möchten Sie die neue Aufgabe laden?</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="apiStore.initAfterReplaceDataConfirmed">
            <v-icon left icon="mdi-reload"></v-icon>
            <span>Laden</span>
          </v-btn>
          <v-btn :href="apiStore.returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>Abbrechen</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog persistent v-model="apiStore.showItemReplaceConfirmation">
      <v-card>
        <v-card-text>
          <p>In Ihrem Browser sind Korrekturen für eine andere Abgabe vorhanden, die noch nicht übertragen wurden.
            Durch das Laden werden diese Korrekturen gelöscht.</p>
          <p>Möchten Sie die neue Abgabe laden?</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="apiStore.initAfterReplaceItemConfirmed">
            <v-icon left icon="mdi-reload"></v-icon>
            <span>Laden</span>
          </v-btn>
          <v-btn :href="apiStore.returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>Abbrechen</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-main>
</template>


<style scoped>

</style>
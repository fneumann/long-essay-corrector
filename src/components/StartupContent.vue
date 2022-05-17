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
        <span>Beenden ...</span>
      </v-btn>
    </v-app-bar>

    <v-dialog persistent v-model="apiStore.showInitFailure">
      <v-card>
        <v-card-text>
          <p>Beim Laden der Daten ist ein Fehler aufgetreten. Die Anwendung kann nicht gestartet werden.</p>
        </v-card-text>
        <v-card-actions>
          <v-btn :href="apiStore.returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>Beenden</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog persistent v-model="apiStore.showReplaceConfirmation">
      <v-card>
        <v-card-text>
          <p>In Ihrem Browser sind Eingaben eines anderen Benutzers oder einer anderen Aufgabe vorhanden, die noch nicht übertragen wurden.
            Durch das Laden werden diese Eingaben gelöscht.</p>
          <p>Möchten Sie die neue Aufgabe laden?</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="apiStore.loadDataFromBackend()">
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

    <v-dialog persistent v-model="apiStore.showReloadConfirmation">
      <v-card>
        <v-card-text>
          <p>In Ihrem Browser sind Eingaben vorhanden, die noch nicht übertragen wurden.
            Die letzte im System gespeicherte Eingabe scheint aber nicht aus diesem Browser zu stammen.
            Das kann z.B. passieren, wenn Ihre Netzverbindung unterbrochen wurde und Sie anschließend
            in einem anderen Browser weitergearbeitet haben.
            Durch das Laden werden Ihre Eingaben im Browser überschrieben.</p>
          <p>Möchten Sie die Eingabe vom System laden?</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="apiStore.loadDataFromBackend()">
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
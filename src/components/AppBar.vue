<script setup>
/**
 * Application bar
 */
import Items from "@/components/Items.vue";
import StitchDecision from "@/components/StitchDecision.vue";
import {useApiStore} from '@/store/api';
import {useSummaryStore} from '@/store/summary';
import {useTaskStore} from '@/store/task';


const apiStore = useApiStore();
const summaryStore = useSummaryStore();
const taskStore = useTaskStore();


async function returnToBackend() {
  if (!summaryStore.isSent) {
    await summaryStore.sendUpdate(true);
  }
  if (!summaryStore.isSent) {
    apiStore.setShowSendFailure(true);
  }
  else {
    window.location = apiStore.returnUrl;
  }
}

</script>

<template>
  <v-app-bar elevation="1" color="white" density="compact" >
    <v-app-bar-title>{{ taskStore.title}}</v-app-bar-title>
    <v-spacer></v-spacer>
    <stitch-decision v-if="apiStore.isStitchDecision"/>
    <items />
    <v-btn @click="returnToBackend()">
      <v-icon left icon="mdi-logout-variant"></v-icon>
      <span>Korrekturen</span>
    </v-btn>
  </v-app-bar>

</template>

<script setup>
/**
 * Application bar
 */
import Items from "@/components/Items.vue";
import StitchDecision from "@/components/StitchDecision.vue";
import {useApiStore} from '@/store/api';
import {useTaskStore} from '@/store/task';
const apiStore = useApiStore();
const taskStore = useTaskStore();
</script>

<template>
  <v-app-bar elevation="1" color="white" density="compact" >
    <v-app-bar-title>{{ taskStore.title}}</v-app-bar-title>
    <v-spacer></v-spacer>
    <stitch-decision v-if="apiStore.isStitchDecision"/>
    <items />
    <v-btn :href="apiStore.returnUrl">
      <v-icon left icon="mdi-logout-variant"></v-icon>
      <span>Korrekturen</span>
    </v-btn>
  </v-app-bar>

</template>

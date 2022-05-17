<script setup>

/**
 * AApplication bar
 */
import Timer from "@/components/Timer.vue";
import {useApiStore} from '@/store/api';
import {useTaskStore} from "../store/task";
const apiStore = useApiStore();
const taskStore = useTaskStore();

function getTitle() {
  return (taskStore.writer_name == null ? '' : taskStore.writer_name + ', ') + (taskStore.title ?? '');
}
</script>

<template>
  <v-app-bar elevation="1" color="white" density="compact" >
    <v-app-bar-title>{{getTitle()}}</v-app-bar-title>
    <v-spacer></v-spacer>

<!--
    <v-btn>
      <v-icon left icon="mdi-bell-outline"></v-icon>
      <span>0 Mitteilungen</span>
    </v-btn>
-->
    <timer v-if="taskStore.hasWritingEnd"></timer>

    <v-btn v-show="!apiStore.review">
      <v-icon left icon="mdi-logout-variant"></v-icon>
      <span>Beenden ...</span>

      <v-menu activator="parent" anchor="bottom end" origin="end top">
        <v-card>
          <v-list>
            <v-list-item :href="apiStore.returnUrl">
              <v-list-item-title>Unterbrechen</v-list-item-title>
            </v-list-item>
            <v-list-item @click="apiStore.review=true">
              <v-list-item-title>Vorschau / Abgabe ...</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-btn>
  </v-app-bar>

</template>

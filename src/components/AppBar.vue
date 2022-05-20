<script setup>
/**
 * Application bar
 */
import Items from "@/components/Items.vue";
import {useApiStore} from '@/store/api';
const apiStore = useApiStore();
</script>

<template>
  <v-app-bar elevation="1" color="white" density="compact" >
    <v-app-bar-title><items /></v-app-bar-title>
    <v-spacer></v-spacer>

    <v-btn :href="apiStore.returnUrl">
      <v-icon left icon="mdi-logout-variant"></v-icon>
      <span>Beenden</span>
    </v-btn>
  </v-app-bar>

</template>

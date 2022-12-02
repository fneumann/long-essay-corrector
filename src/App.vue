<script setup>

/**
 * Main Application
 */
import AppBar from "@/components/AppBar.vue";
import NavBar from "@/components/NavBar.vue";
import StateBar from "@/components/StateBar.vue";
import MainContent from "@/components/MainContent.vue";
import StartupContent from "@/components/StartupContent.vue";
import {useApiStore} from '@/store/api';

const apiStore = useApiStore();
apiStore.init();

</script>

<template>
    <v-app fill-height>
      <startup-content v-if="!apiStore.initialized" />

      <app-bar v-if="apiStore.initialized"/>
      <state-bar v-if="apiStore.initialized"/>
      <nav-bar v-if="apiStore.initialized"/>
      <main-content v-if="apiStore.initialized"/>
    </v-app>
</template>

<style>

html {
  overflow-y: hidden !important;
}

/* needed for instructions and review screen, must be global */
.col-content li {
  margin-left: 20px;
  margin-bottom: 5px;
}

.col-content p {
  margin-bottom: 10px;
}

/* needed to avoid highlight of selected NavBar item, must be global */
.v-list-item__overlay {
  visibility: hidden !important;
}

.v-navigation-drawer__content {
  background-color: #fafafa;
}


</style>

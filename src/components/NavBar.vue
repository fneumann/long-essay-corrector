<script setup>
import {useLayoutStore} from "../store/layout";
import {useResourcesStore} from "../store/resources";
const layoutStore = useLayoutStore();
const resourcesStore = useResourcesStore();

function openNavigation() {
  document.getElementById('app-navigation-drawer').dispatchEvent(new Event('mouseenter'));
}

function closeNavigation() {
  document.getElementById('app-navigation-drawer').dispatchEvent(new Event('mouseleave'));
}

function selectResource(resource) {
  if (resource.type == 'url') {
    window.open(resource.source, 'long-essay-writer-resource-' + resource.key)
  }
  else {
    resourcesStore.selectResource(resource);
    layoutStore.showResources();
  }
}

function getResourceIcon(resource) {
  switch (resource.type) {
    case "url":
      return (resourcesStore.isActive(resource) && layoutStore.isResourcesVisible) ? "mdi-file-link" : "mdi-file-link-outline"
    default:
      return (resourcesStore.isActive(resource) && layoutStore.isResourcesVisible) ? "mdi-file" : "mdi-file-outline"
  }
}

</script>

<template>
  <v-navigation-drawer id="app-navigation-drawer" elevation="2" width="500" permanent rail expand-on-hover>

    <v-list>
      <v-list-item @click="layoutStore.showInstructions(); closeNavigation();"
                   :prepend-icon="layoutStore.isInstructionsVisible ? 'mdi-text-box': 'mdi-text-box-outline'"
                   title="Aufgabenstellung">
      </v-list-item>
      <v-list-item @click="layoutStore.showEssay(); closeNavigation();"
                   :prepend-icon="layoutStore.isEssayVisible ? 'mdi-file': 'mdi-file-outline'"
                   title="Abgegebener Text">
      </v-list-item>
      <v-list-item @click="layoutStore.showSummary(); closeNavigation();"
                   :prepend-icon="layoutStore.isSummaryVisible ? 'mdi-file-edit': 'mdi-file-edit-outline'"
                   title="Meine Korrektur">
      </v-list-item>

      <v-list-group v-show="resourcesStore.hasResources">
        <template v-slot:activator="{ props }">
          <v-list-item active-class="appNavActive" v-bind="props"
                       @mouseenter="openNavigation()"
                       :prepend-icon="layoutStore.isResourcesVisible ? 'mdi-book-open' : 'mdi-book-open-outline'"
                       title="Material">
          </v-list-item>
        </template>

        <v-list-item v-for="resource in resourcesStore.resources"
                     @click="selectResource(resource); closeNavigation();"
                     :prepend-icon="getResourceIcon(resource)"
                     :title="resource.title"
                     :key="resource.key">
        </v-list-item>

      </v-list-group>

    </v-list>

  </v-navigation-drawer>
</template>

<style scoped>

.v-list {
  overflow-x: hidden;
  background-color: #fafafa;
}

/* avoid highlight, when selected, see also App.vue */
.v-list-item, v-list-group {
  color: #000000!important;
}

</style>

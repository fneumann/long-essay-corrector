<script setup>
  import {useSummaryStore} from '@/store/summary';
  const summaryStore = useSummaryStore();
</script>

<template>
  <v-app-bar position="bottom" height="48" color="grey-lighten-5" elevation="1">
    Letzte Änderung: {{summaryStore.openSending ? 'nicht gesendet' : 'gesendet'}}
  </v-app-bar>
</template>

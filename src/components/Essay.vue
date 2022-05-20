<script setup>
  import {useEssayStore} from '@/store/essay';
  const essayStore = useEssayStore();
</script>

<template>
  <div id="app-essay" v-html="essayStore.text"></div>
</template>

<style scoped>
  #app-essay {
    height: 100%;
    padding: 20px;
    border: 1px solid #cccccc;
    overflow-y: scroll;
  }


</style>
<script setup>
  import {useTaskStore} from '@/store/task';
  const taskStore = useTaskStore();
</script>

<template>
  <div id="app-instructions" v-html="taskStore.instructions"></div>
</template>

<style scoped>

  @import '@/styles/content.css';

  #app-instructions {
    height: 100%;
    padding: 20px;
    border: 1px solid #cccccc;
    overflow-y: scroll;
  }


</style>
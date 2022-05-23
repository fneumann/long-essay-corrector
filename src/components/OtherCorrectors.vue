<script setup>
import {useCorrectorsStore} from '@/store/correctors';
const correctorsStore = useCorrectorsStore();

</script>

<template>
  <div class="correctors">
    <template v-for="corrector in correctorsStore.correctors" :key="corrector.key">
      <div class="appCorrector" v-show="correctorsStore.isActive(corrector)" v-html="corrector.text">
      </div>
    </template>
  </div>
</template>


<style scoped>

div {
  height:100%;
}

.appCorrector {
  height: 100%;
  padding: 20px;
  border: 1px solid #cccccc;
  overflow-y: scroll;
}

</style>
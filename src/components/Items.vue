<script setup>
  import {useApiStore} from '@/store/api';
  import {useItemsStore} from '@/store/items';
  import {useSummaryStore} from "@/store/summary";
  import {useEssayStore} from "@/store/essay";

  const apiStore = useApiStore();
  const itemsStore = useItemsStore();
  const summaryStore = useSummaryStore();
  const essayStore = useEssayStore();


  function previousItem(key) {
    let newKey = itemsStore.previousKey(key);
    apiStore.loadItemFromBackend(newKey);
  }

  function nextItem(key) {
    let newKey = itemsStore.nextKey(key);
    apiStore.loadItemFromBackend(newKey);
  }
</script>

<template>
 <div class="items">
   <template v-for="item in itemsStore.items" :key="item.key">
     <div v-if="item.key == apiStore.itemKey">

       <v-btn :disabled="item.key == itemsStore.firstKey" @click="previousItem(item.key)">
         <v-icon left icon="mdi-arrow-left-bold"></v-icon>
       </v-btn>

       <span>{{ item.title }}</span>
       <template v-if="apiStore.isCorrection">
         <span v-show="summaryStore.isAuthorized"> - autorisiert</span>
         <span v-show="!summaryStore.isAuthorized"> - offen</span>
       </template>
       <template v-if="!apiStore.isCorrection">
         <span v-show="essayStore.isFinalized"> - finalisiert</span>
         <span v-show="!essayStore.isFinalized"> - offen</span>
       </template>

       <v-btn :disabled="item.key == itemsStore.lastKey" @click="nextItem(item.key)">
         <v-icon left icon="mdi-arrow-right-bold"></v-icon>
       </v-btn>
     </div>
   </template>
 </div>
</template>


<style scoped>

</style>

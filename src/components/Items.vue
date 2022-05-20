<script setup>
  import {useApiStore} from '@/store/api';
  import {useItemsStore} from '@/store/items';
  import {useTaskStore} from '@/store/task';

  const apiStore = useApiStore();
  const itemsStore = useItemsStore();
  const taskStore = useTaskStore();

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

       <v-btn v-show="item.key != itemsStore.firstKey" @click="previousItem(item.key)">
         <v-icon left icon="mdi-menu-left"></v-icon>
       </v-btn>

       <span>{{ taskStore.title}} - {{ item.title }}</span>

       <v-btn v-show="item.key != itemsStore.lastKey" @click="nextItem(item.key)">
         <v-icon left icon="mdi-menu-right"></v-icon>
       </v-btn>
     </div>
   </template>
 </div>
</template>


<style scoped>

</style>
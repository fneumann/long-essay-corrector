<script setup>
  import {useResourcesStore} from '@/store/resources';

  const resourcesStore = useResourcesStore();

</script>

<template>
 <div class="resources">
   <template v-for="resource in resourcesStore.resources" :key="resource.key">
     <div v-if="resource.type=='file'" v-show="resourcesStore.isActive(resource)">
       <!--
       <p><a :target= "'long-essay-writer-resource-' + resource.key" :href="apiStore.resourceUrl(resource.key)">{{ resource.title }}</a></p>
       -->
       <object
           v-if="resource.mimetype =='application/pdf'"
           type="application/pdf"
           :data="resource.objectUrl"
            width="100%"
            height="100%">
       </object>
     </div>

   </template>
 </div>
</template>


<style scoped>

div {
  height:100%;
}

</style>
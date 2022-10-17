<script setup>
  import { ref } from 'vue'
  import {useApiStore} from '@/store/api';
  import {useEssayStore} from '@/store/essay';
  import {useItemsStore} from '@/store/items';
  import {useCorrectorsStore} from '@/store/correctors';

  const apiStore = useApiStore();
  const essayStore = useEssayStore();
  const itemsStore = useItemsStore();
  const correctorsStore = useCorrectorsStore();

  let dialogOpen = ref(false);

  async function saveAndContinue() {
    dialogOpen.value=false;
    await essayStore.saveStitchDecision();
    let newKey = itemsStore.nextKey(apiStore.itemKey);
    if (newKey != '') {
      apiStore.loadItemFromBackend(newKey);
    }
  }

  async function saveAndClose() {
    dialogOpen.value =false;
    await essayStore.saveStitchDecision();
    window.location = apiStore.returnUrl;
  }
</script>

<template>
 <div class="stitch">
   <v-btn :disabled="essayStore.correction_finalized" @click="dialogOpen=true">
     <v-icon left icon="mdi-checkbox-marked-outline"></v-icon>
     Stichentscheid
   </v-btn>

   <v-dialog persistent v-model="dialogOpen">
     <v-card>
       <v-card-title>Stichentscheid</v-card-title>
       <v-card-text>
         <p>
           Mit Ihrerm Stichentscheid wird die Bewertung dieser Abgabe abgeschlossen.
         </p>
         <br>
         <p>Minimale Punkte: {{  correctorsStore.minPoints }}</p>
         <p>Maximale Punkte: {{ correctorsStore.maxPoints}}</p>
         <br>
         <p>
           <label for="appFinalPoints">Finale Punkte: </label>
           <input id="appFinalPoints" class="appRatingControl" type="number" :min="correctorsStore.minPoints" :max="correctorsStore.maxPoints" v-model="essayStore.final_points" />
           <span v-html="essayStore.grade"></span>
         </p>

       </v-card-text>
       <v-card-actions>
         <v-btn @click="saveAndContinue()">
           <v-icon left icon="mdi-check"></v-icon>
           <span>Festlegen und Weiter</span>
         </v-btn>
         <v-btn @click="saveAndClose()">
           <v-icon left icon="mdi-check"></v-icon>
           <span>Festlegen und Schließen</span>
         </v-btn>
         <v-btn @click="dialogOpen=false">
           <v-icon left icon="mdi-close"></v-icon>
           <span>Abbrechen</span>
         </v-btn>
       </v-card-actions>
     </v-card>
   </v-dialog>
 </div>


</template>


<style scoped>

.appRatingControl {
  border: 1px solid lightgray;
  margin-left: 10px;
  margin-right: 10px;
  padding: 5px;
}

</style>
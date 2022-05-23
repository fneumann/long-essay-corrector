<script setup>
  import Instructions from "@/components/Instructions.vue";
  import Resources from "@/components/Resources.vue";
  import OtherCorrectors from "@/components/OtherCorrectors.vue";
  import Essay from "@/components/Essay.vue";
  import EditSummary from "@/components/EditSummary.vue";
  import {useLayoutStore} from "../store/layout";
  import {useResourcesStore} from "../store/resources";
  import {useCorrectorsStore} from "../store/correctors";
  const layoutStore = useLayoutStore();
  const resourcesStore = useResourcesStore();
  const correctorsStore = useCorrectorsStore();
</script>

<template>
  <v-main fill-height>
    <div class="container">
      <div  class="column" :class="{ colExpanded: layoutStore.isLeftExpanded, colNormal: !layoutStore.isLeftExpanded}" v-show="layoutStore.isLeftVisible">
        <div class="col-header">
          <h2 class="text-h6" v-show="layoutStore.isInstructionsVisible">Aufgabenstellung</h2>
          <h2 class="text-h6" v-show="layoutStore.isEssayVisible">Abgegebener Text</h2>
          <h2 class="text-h6" v-show="layoutStore.isResourcesVisible">{{ resourcesStore.activeTitle }}</h2>
          <h2 class="text-h6" v-show="layoutStore.isCorrectorsVisible">{{ correctorsStore.activeTitle }}</h2>
        </div>
        <div class="col-content">
          <instructions v-show="layoutStore.isInstructionsVisible" />
          <essay v-show="layoutStore.isEssayVisible" />
          <resources v-show="layoutStore.isResourcesVisible" />
          <other-correctors v-show="layoutStore.isCorrectorsVisible" />

        </div>
        <div class="col-footer text-right" :class="{ footerExpanded: layoutStore.isLeftExpanded, footerNormal: !layoutStore.isLeftExpanded}" >
          <v-btn class="ma-2" @click="layoutStore.setLeftExpanded(false)" v-show="layoutStore.isLeftExpanded">
            <v-icon icon="mdi-chevron-left"></v-icon>
            <span>Meine Korrektur</span>
          </v-btn>
          <v-btn class="ma-2" @click="layoutStore.setLeftExpanded(true)" v-show="!layoutStore.isLeftExpanded">
            <span>Erweitern</span>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </v-btn>
        </div>
      </div>
      <div class="column" :class="{ colExpanded: layoutStore.isRightExpanded, colNormal: !layoutStore.isRightExpanded}" v-show="layoutStore.isRightVisible" >
        <div class="col-header">
          <h2 class="text-h6">Meine Korrektur</h2>
        </div>
        <div class="col-content">
          <edit-summary />
        </div>
        <div class="col-footer text-left" :class="{ footerExpanded: layoutStore.isRightExpanded, footerNormal: !layoutStore.isRightExpanded}">
          <v-btn class="ma-2" @click="layoutStore.setRightExpanded(true)" v-show="!layoutStore.isRightExpanded">
            <v-icon icon="mdi-chevron-left"></v-icon>
            <span>Erweitern</span>
          </v-btn>
          <v-btn class="ma-2" @click="layoutStore.setRightExpanded(false)" v-show="layoutStore.isRightExpanded">
            <span v-show="layoutStore.isInstructionsSelected">Aufgabenstellung</span>
            <span v-show="layoutStore.isEssaySelected">Abgegebener Text</span>
            <span v-show="layoutStore.isResourcesSelected">{{ resourcesStore.activeTitle }}</span>
            <span v-show="layoutStore.isCorrectorsSelected">{{ correctorsStore.activeTitle }}</span>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </v-btn>
        </div>
      </div>
    </div>
  </v-main>
</template>

<style scoped>

/* Structure */

.container {
  position: fixed;
  height: calc((100% - 50px) - 50px);
  width: calc(100% - 72px);
  display: flex;
}

.column {
  flex: 1;
}

.col-header {
  height: 50px;
  width: 100%;
  padding:10px;
}

.col-content {
  height: calc(((100% - 50px)) - 70px);
  background-color: white;
  overflow: hidden;
  width: 100%;
  padding:10px;
}

.col-footer {
  position: fixed;
  bottom: 48px;
  padding:20px;
}

/* Dynamic Properties */

.colNormal {
  width: 50%;
}

.colExpanded {
  width: 100%;
}

.footerNormal {
  width: calc(50% - 50px);
}
.footerExpanded {
  width: calc(100% - 100px);
}


</style>

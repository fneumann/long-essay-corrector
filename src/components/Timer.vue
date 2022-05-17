<script setup>
  import {useTaskStore} from "../store/task";
  import {useLayoutStore} from "../store/layout";

  const taskStore = useTaskStore();
  const layoutStore = useLayoutStore();

  /**
   *
   * @param int timespan  seconds
   * @returns {string}
   */
  function formatTimespan(timespan)
  {
    const seconds = ('00'+ (Math.floor(timespan) % 60)).slice(-2);
    const minutes = ('00' + (Math.floor(timespan / 60) % 60)).slice(-2);
    const hours = ('00' + (Math.floor(timespan / 3600)  % 24)).slice(-2);
    const days = Math.floor(timespan / 86400);

    if (days > 1) {
      return days + ' Tage ' + hours + ' Stunden';
    }
    else if (days > 0) {
      return days + ' Tag ' + hours + ' Stunden';
    }
    else if (hours != '00') {
      return hours + ':' + minutes + ':' + seconds + ' Stunden'; // todo: don't show seconds
    }
    else if (minutes != '00') {
      return minutes + ':' + seconds + ' Minuten';              // todo: don't show seconds
    }
    else  {
      return seconds + ' Sekunden';
    }
  }

</script>


<template>
  <v-btn @click="layoutStore.toggleTimer()" v-show="!taskStore.writingEndReached">
    <v-icon left icon="mdi-clock-outline"></v-icon>
    <span v-show=layoutStore.showTimer>{{ formatTimespan(taskStore.remaining_time) }}</span>
  </v-btn>
</template>



<style scoped>

</style>
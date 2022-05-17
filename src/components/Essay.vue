<script setup>
/*
* Import TinyMCE
*/
import 'tinymce';
// Default icons are required for TinyMCE 5.3 or above
import 'tinymce/icons/default';
// A theme is also required
import 'tinymce/themes/silver';
// Import the skin
import 'tinymce/skins/ui/oxide/skin.css';
/* Import plugins */
import 'tinymce/plugins/lists';
import 'tinymce/plugins/charmap';
/* Import tiny vue integration */
import Editor from '@tinymce/tinymce-vue'

import {useEssayStore} from '@/store/essay';
const essayStore = useEssayStore();

import {useSettingsStore} from "../store/settings";
const settingsStore = useSettingsStore();

function toolbar() {
  switch (settingsStore.formatting_options)
  {
    case 'full':
      return 'undo redo | formatselect | bold italic underline | bullist numlist | removeformat | charmap';
    case 'medium':
      return 'undo redo | bold italic underline | bullist numlist | removeformat | charmap';
    case 'minimal':
      return 'undo redo | bold italic underline | removeformat | charmap';
    case 'none':
    default:
      return 'undo redo | charmap';
  }
}

// Used for retrieving the editor instance using the tinymce.get('ID') method.
const id = "essay";
</script>

<template>
  <editor
      :id="id"
      v-model="essayStore.currentContent"
      @change="essayStore.updateContent(true)"
      @keyup="essayStore.updateContent(true)"
      api-key="no-api-key"
      :init="{
        height: '100%',
        menubar: false,
        plugins: 'lists charmap',
        toolbar: toolbar(),
        custom_undo_redo_levels: 10
       }"
  />
</template>

<style>
.tox-statusbar {
  display: none!important;
}
</style>
<script setup lang="ts">
import { renderNote } from '~/utils/renderNote'

// renderNote 會先跳脫 HTML，所以 v-html 是安全的
const props = defineProps<{ body: string }>()
const html = computed(() => renderNote(props.body))
</script>

<template>
  <div class="note-body" v-html="html" />
</template>

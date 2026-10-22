<script setup lang="ts">
// 列表、返回用的箭頭。用 SVG 而不是 › 字元，字元太細太小看不出來是箭頭
withDefaults(defineProps<{ left?: boolean }>(), { left: false })
</script>

<template>
  <svg
    class="h-5 w-5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="left ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'" />
  </svg>
</template>

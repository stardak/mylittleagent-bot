<template>
  <span class="isolate inline-flex rounded-md shadow-xs dark:shadow-none">
    <button type="button" class="relative inline-flex items-center rounded-l-md bg-white px-2 py-2 text-gray-400 inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 focus:z-10 dark:bg-white/10 dark:inset-ring-gray-700 dark:hover:bg-white/20">
      <span class="sr-only">Previous</span>
      <ChevronLeftIcon class="size-5" aria-hidden="true" />
    </button>
    <button type="button" class="relative -ml-px inline-flex items-center rounded-r-md bg-white px-2 py-2 text-gray-400 inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 focus:z-10 dark:bg-white/10 dark:inset-ring-gray-700 dark:hover:bg-white/20">
      <span class="sr-only">Next</span>
      <ChevronRightIcon class="size-5" aria-hidden="true" />
    </button>
  </span>
</template>

<script setup>
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid'
</script>
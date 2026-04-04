<template>
  <div class="flex items-center">
    <div class="w-full border-t border-gray-300 dark:border-white/15" aria-hidden="true"></div>
    <div class="relative flex justify-center">
      <button type="button" class="inline-flex items-center gap-x-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20">
        <PlusIcon class="-mr-0.5 -ml-1 size-5 text-gray-400" aria-hidden="true" />
        Button text
      </button>
    </div>
    <div class="w-full border-t border-gray-300 dark:border-white/10" aria-hidden="true"></div>
  </div>
</template>

<script setup>
import { PlusIcon } from '@heroicons/vue/20/solid'
</script>
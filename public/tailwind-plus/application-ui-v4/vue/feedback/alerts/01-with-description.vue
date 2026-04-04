<template>
  <div class="rounded-md bg-yellow-50 p-4 dark:bg-yellow-500/10 dark:outline dark:outline-yellow-500/15">
    <div class="flex">
      <div class="shrink-0">
        <ExclamationTriangleIcon class="size-5 text-yellow-400 dark:text-yellow-300" aria-hidden="true" />
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-100">Attention needed</h3>
        <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-100/80">
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid pariatur, ipsum similique veniam quo totam eius aperiam dolorum.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ExclamationTriangleIcon } from '@heroicons/vue/20/solid'
</script>